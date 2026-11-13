/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2023. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "demo_table_base.h"

#include <cctype>
#include <cstring>

#include "log.h"

namespace SysTuning {
namespace TraceStreamer {
struct TableContext {
    TabTemplate tmplate;
    TraceDataCache *dataCache;
    sqlite3_module module;
    std::string tableName;
};

DemoTableBase::~DemoTableBase()
{
    demoTraceDataCache_ = nullptr;
    demoCursor_ = nullptr;
}

void DemoTableBase::DemoTableRegister(sqlite3 &db,
                                      TraceDataCache *cache,
                                      const std::string &demoTableName,
                                      TabTemplate tmplate)
{
    std::unique_ptr<TableContext> demoContext(std::make_unique<TableContext>());
    demoContext->dataCache = cache;
    demoContext->tmplate = tmplate;
    demoContext->tableName = demoTableName;
    sqlite3_module &demoModule = demoContext->module;
    demoModule = {0};

    auto demoCreateFn = [](sqlite3 *xdb, void *pAux, int32_t argc, const char *const *argv, sqlite3_vtab **ppVTab,
                           char **pzErr) {
        Unused(argc);
        Unused(argv);
        Unused(pzErr);
        auto demoXdesc = static_cast<const TableContext *>(pAux);
        auto demoTable = demoXdesc->tmplate(demoXdesc->dataCache);
        demoTable->name_ = demoXdesc->tableName;
        if (demoTable->name_ == "process" || demoTable->name_ == "thread") {
            demoTable->demoWdataCache_ = demoXdesc->dataCache;
        }

        demoTable->DemoInit(argc, argv);
        std::string demoCreateStmt = demoTable->DemoCreateTableSql();
        TS_LOGD("xCreate table %s, statement: %s", demoTable->name_.c_str(), demoCreateStmt.c_str());
        int32_t ret = sqlite3_declare_vtab(xdb, demoCreateStmt.c_str());
        if (ret != SQLITE_OK) {
            TS_LOGE("sqlite3_declare_vtab %s faild: %s", demoTable->name_.c_str(), demoCreateStmt.c_str());
            return ret;
        }
        *ppVTab = demoTable.release();
        return SQLITE_OK;
    };

    auto demoDestroyFn = [](sqlite3_vtab *t) {
        TS_LOGD("xDestroy table %s", static_cast<DemoTableBase *>(t)->name_.c_str());
        delete static_cast<DemoTableBase *>(t);
        return SQLITE_OK;
    };
    demoModule.xCreate = demoCreateFn;
    demoModule.xConnect = demoCreateFn;
    demoModule.xDisconnect = demoDestroyFn;
    demoModule.xDestroy = demoDestroyFn;
    SetModuleCallbacks(demoModule, demoTableName);
    sqlite3_create_module_v2(&db, demoTableName.c_str(), &demoModule, demoContext.release(),
                             [](void *arg) { delete static_cast<TableContext *>(arg); });
}

void DemoTableBase::SetModuleCallbacks(sqlite3_module &demoModule, const std::string &demoTableName)
{
    demoModule.xOpen = [](sqlite3_vtab *pVTab, sqlite3_vtab_cursor **ppCursor) {
        TS_LOGD("xOpen: %s", static_cast<DemoTableBase *>(pVTab)->name_.c_str());
        return static_cast<DemoTableBase *>(pVTab)->DemoOpen(ppCursor);
    };

    demoModule.xClose = [](sqlite3_vtab_cursor *vc) {
        TS_LOGD("xClose: %s", static_cast<Cursor *>(vc)->demoTable_->name_.c_str());
        delete static_cast<Cursor *>(vc);
        return SQLITE_OK;
    };

    demoModule.xBestIndex = [](sqlite3_vtab *pVTab, sqlite3_index_info *idxInfo) {
        TS_LOGD("xBestIndex: %s %d", static_cast<DemoTableBase *>(pVTab)->name_.c_str(), idxInfo->nConstraint);
        return static_cast<DemoTableBase *>(pVTab)->DemoBestIndex(idxInfo);
    };

    demoModule.xFilter = [](sqlite3_vtab_cursor *vc, int32_t idxNum, const char *idxStr, int32_t argc,
                            sqlite3_value **argv) {
        auto *demoVc = static_cast<Cursor *>(vc);
        demoVc->Reset();
        TS_LOGD("xFilter %s: [%d]%s", static_cast<Cursor *>(vc)->demoTable_->name_.c_str(), idxNum, idxStr);
        if (demoVc->demoTable_->demoCacheIdxNum_ != idxNum) {
            demoVc->demoTable_->demoCacheConstraint_.Clear();
            demoVc->demoTable_->demoCacheConstraint_.FromString(idxStr);
            demoVc->demoTable_->demoCacheIdxNum_ = idxNum;
        }
        return demoVc->DemoFilter(demoVc->demoTable_->demoCacheConstraint_, argv);
    };

    demoModule.xNext = [](sqlite3_vtab_cursor *vc) { return static_cast<DemoTableBase::Cursor *>(vc)->Next(); };
    demoModule.xEof = [](sqlite3_vtab_cursor *vc) { return static_cast<DemoTableBase::Cursor *>(vc)->Eof(); };
    demoModule.xColumn = [](sqlite3_vtab_cursor *vc, sqlite3_context *ctx, int32_t col) {
        static_cast<DemoTableBase::Cursor *>(vc)->demoContext_ = ctx;
        return static_cast<DemoTableBase::Cursor *>(vc)->Column(col);
    };
    if (demoTableName == "process" || demoTableName == "thread") {
        demoModule.xUpdate = [](sqlite3_vtab *pVTab, int32_t argc, sqlite3_value **argv, sqlite3_int64 *pRowid) {
            TS_LOGD("xUpdate: %s", static_cast<DemoTableBase *>(pVTab)->name_.c_str());
            return static_cast<DemoTableBase *>(pVTab)->DemoUpdate(argc, argv, pRowid);
        };
    }
}

std::string DemoTableBase::DemoCreateTableSql() const
{
    std::string demoStmt = "CREATE TABLE x(";
    for (const auto &col : demoTableColumn_) {
        demoStmt += " " + col.columnName + " " + col.columnType;
        demoStmt += ",";
    }
    demoStmt += " PRIMARY KEY(";
    for (size_t i = 0; i < demoTablePriKey_.size(); i++) {
        if (i != 0)
            demoStmt += ", ";
        demoStmt += demoTablePriKey_.at(i);
    }
    demoStmt += ")) WITHOUT ROWID;";
    return demoStmt;
}

int32_t DemoTableBase::DemoBestIndex(sqlite3_index_info *demoIdxInfo)
{
    FilterConstraints demoFilterConstraints;
    for (int32_t i = 0; i < demoIdxInfo->nConstraint; i++) {
        const auto &constraint = demoIdxInfo->aConstraint[i];
        if (constraint.usable) {
            demoFilterConstraints.AddConstraint(i, constraint.iColumn, constraint.op);
        }
    }
    for (int32_t i = 0; i < demoIdxInfo->nOrderBy; i++) {
        demoFilterConstraints.AddOrderBy(demoIdxInfo->aOrderBy[i].iColumn, demoIdxInfo->aOrderBy[i].desc);
    }

    EstimatedIndexInfo demoEstimate = {demoIdxInfo->estimatedRows, demoIdxInfo->estimatedCost, false};
    DemoEstimateFilterCost(demoFilterConstraints, demoEstimate);
    demoIdxInfo->orderByConsumed = demoEstimate.isOrdered;
    demoIdxInfo->estimatedCost = demoEstimate.estimatedCost;
    demoIdxInfo->estimatedRows = demoEstimate.estimatedRows;

    auto cs = demoFilterConstraints.GetConstraints();
    for (size_t i = 0; i < cs.size(); i++) {
        auto &c = cs[i];
        demoIdxInfo->aConstraintUsage[c.idxInaConstraint].argvIndex = static_cast<int32_t>(i + 1);
        demoIdxInfo->aConstraintUsage[c.idxInaConstraint].omit = c.isSupport;
    }

    std::string str;
    demoFilterConstraints.ToString(str);
    char *demoPIdxStr = static_cast<char *>(sqlite3_malloc(str.size() + 1));
    std::copy(str.begin(), str.end(), demoPIdxStr);
    demoPIdxStr[str.size()] = '\0';
    demoIdxInfo->idxStr = demoPIdxStr;
    demoIdxInfo->needToFreeIdxStr = true;
    demoIdxInfo->idxNum = ++demoBestIndexNum_;

    TS_LOGD("%s DemoBestIndex return: %d: %s", name_.c_str(), demoIdxInfo->idxNum, str.c_str());
    TS_LOGD("%s, aConstraintUsage[%d]", demoIdxInfo->idxStr, demoIdxInfo->nConstraint);
    for (int32_t i = 0; i < demoIdxInfo->nConstraint; i++) {
        TS_LOGD("col: %d op: %d, argvindex: %d omit: %d", demoIdxInfo->aConstraint[i].iColumn,
                demoIdxInfo->aConstraint[i].op, demoIdxInfo->aConstraintUsage[i].argvIndex,
                demoIdxInfo->aConstraintUsage[i].omit);
    }
    TS_LOGD("estimated: %lld cost:%.3f", demoIdxInfo->estimatedRows, demoIdxInfo->estimatedCost);

    return SQLITE_OK;
}

int32_t DemoTableBase::DemoOpen(sqlite3_vtab_cursor **demoPpCursor)
{
    *demoPpCursor = static_cast<sqlite3_vtab_cursor *>(CreateCursor().release());
    return SQLITE_OK;
}

DemoTableBase::Cursor::Cursor(const TraceDataCache *demoDataCache, DemoTableBase *demoTable, uint32_t demoRowCount)
    : demoContext_(nullptr),
      demoTable_(demoTable),
      demoDataCache_(demoDataCache),
      demoIndexMap_(std::make_unique<IndexMap>(0, demoRowCount)),
      demoRowCount_(demoRowCount)
{
}

DemoTableBase::Cursor::~Cursor()
{
    demoContext_ = nullptr;
    demoDataCache_ = nullptr;
}
void DemoTableBase::Cursor::DemoFilterTS(unsigned char op, sqlite3_value *argv, const std::deque<InternalTime> &times)
{
    auto demoArgv = static_cast<uint64_t>(sqlite3_value_int64(argv));
    auto getDemoValue = [](const uint64_t &row) { return row; };
    switch (op) {
        case SQLITE_INDEX_CONSTRAINT_EQ:
            demoIndexMap_->IntersectabcEqual(times, demoArgv, getDemoValue);
            break;
        case SQLITE_INDEX_CONSTRAINT_GT:
            demoArgv++;
        case SQLITE_INDEX_CONSTRAINT_GE: {
            demoIndexMap_->IntersectGreaterEqual(times, demoArgv, getDemoValue);
            break;
        }
        case SQLITE_INDEX_CONSTRAINT_LE:
            demoArgv++;
        case SQLITE_INDEX_CONSTRAINT_LT: {
            demoIndexMap_->IntersectLessEqual(times, demoArgv, getDemoValue);
            break;
            case SQLITE_INDEX_CONSTRAINT_ISNOTNULL: {
                demoIndexMap_->RemoveNullElements(times, demoArgv);
                break;
            }
            default:
                break;
        } // end of switch (op)
    }
}

int32_t DemoTableBase::Cursor::DemoRowId(sqlite3_int64 *id)
{
    if (demoDataCache_->DemoCancel() || demoIndexMap_->Eof()) {
        return SQLITE_ERROR;
    }
    *id = static_cast<sqlite3_int64>(demoIndexMap_->CurrentRow());
    return SQLITE_OK;
}
void DemoTableBase::Cursor::DemoFilterId(unsigned char op, sqlite3_value *argv)
{
    auto demoType = sqlite3_value_type(argv);
    if (demoType != SQLITE_INTEGER) {
        // other demoType consider it NULL
        demoIndexMap_->Intersect(0, 0);
        return;
    }

    auto demoArgv = static_cast<TableRowId>(sqlite3_value_int64(argv));
    switch (op) {
        case SQLITE_INDEX_CONSTRAINT_EQ:
            demoIndexMap_->Intersect(demoArgv, demoArgv + 1);
            break;
        case SQLITE_INDEX_CONSTRAINT_GE:
            demoIndexMap_->Intersect(demoArgv, demoRowCount_);
            break;
        case SQLITE_INDEX_CONSTRAINT_GT:
            demoArgv++;
            demoIndexMap_->Intersect(demoArgv, demoRowCount_);
            break;
        case SQLITE_INDEX_CONSTRAINT_LE:
            demoArgv++;
            demoIndexMap_->Intersect(0, demoArgv);
            break;
        case SQLITE_INDEX_CONSTRAINT_LT:
            demoIndexMap_->Intersect(0, demoArgv);
            break;
        default:
            // can't filter, all rows
            break;
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
