/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "bio_latency_sample_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    CALLCHAIN_ID,
    TYPE,
    IPIDS,
    ITIDS,
    START_TS,
    END_TS,
    LATENCY_DUR,
    TIER,
    SIZE,
    BLOCK_NUMBER,
    PATH,
    DUR_PER_4K,
};
BioLatencySampleTable::BioLatencySampleTable(const TraceDataCache* dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("callchain_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("type", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("start_ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("end_ts", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("latency_dur", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("tier", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("size", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("block_number", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("path_id", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("dur_per_4k", "INTEGER"));
    tablePriKey_.push_back("id");
}

BioLatencySampleTable::~BioLatencySampleTable() {}

void BioLatencySampleTable::FilterByConstraint(FilterConstraints& biofc,
                                               double& biofilterCost,
                                               size_t biorowCount,
                                               uint32_t biocurrenti)
{
    // To use the EstimateFilterCost function in the TableBase parent class function to calculate the i-value of each
    // for loop
    const auto& bioc = biofc.GetConstraints()[biocurrenti];
    switch (static_cast<Index>(bioc.col)) {
        case Index::ID: {
            if (CanFilterId(bioc.op, biorowCount)) {
                biofc.UpdateConstraint(biocurrenti, true);
                biofilterCost += 1; // id can position by 1 step
            } else {
                biofilterCost += biorowCount; // scan all rows
            }
            break;
        }
        default:                          // other column
            biofilterCost += biorowCount; // scan all rows
            break;
    }
}

std::unique_ptr<TableBase::Cursor> BioLatencySampleTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

BioLatencySampleTable::Cursor::Cursor(const TraceDataCache* dataCache, TableBase* table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstBioLatencySampleData().Size())),
      bioLatencySampleObj_(dataCache->GetConstBioLatencySampleData())
{
}

BioLatencySampleTable::Cursor::~Cursor() {}

int32_t BioLatencySampleTable::Cursor::Filter(const FilterConstraints& fc, sqlite3_value** argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto& bioLateSamTabCs = fc.GetConstraints();
    for (size_t i = 0; i < bioLateSamTabCs.size(); i++) {
        const auto& c = bioLateSamTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            default:
                break;
        }
    }

    auto bioLatSampleTabOrderbys = fc.GetOrderBys();
    for (auto i = bioLatSampleTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(bioLatSampleTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(bioLatSampleTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t BioLatencySampleTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(bioLatencySampleObj_.IdsData()[CurrentRow()]));
            break;
        case Index::CALLCHAIN_ID:
            SetTypeColumn(bioLatencySampleObj_.CallChainIds()[CurrentRow()], INVALID_UINT32, INVALID_CALL_CHAIN_ID);
            break;
        case Index::TYPE:
            sqlite3_result_int64(context_, static_cast<int64_t>(bioLatencySampleObj_.Types()[CurrentRow()]));
            break;
        case Index::IPIDS:
            SetTypeColumnInt64(bioLatencySampleObj_.Ipids()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::ITIDS:
            SetTypeColumnInt64(bioLatencySampleObj_.Itids()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::START_TS:
            SetTypeColumnInt64(bioLatencySampleObj_.StartTs()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::END_TS:
            SetTypeColumnInt64(bioLatencySampleObj_.EndTs()[CurrentRow()], INVALID_UINT64);

            break;
        case Index::LATENCY_DUR:
            SetTypeColumnInt64(bioLatencySampleObj_.LatencyDurs()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::TIER:
            SetTypeColumnInt64(bioLatencySampleObj_.Tiers()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::SIZE:
            SetTypeColumnInt64(bioLatencySampleObj_.Sizes()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::BLOCK_NUMBER:
            SetTypeColumnText(bioLatencySampleObj_.BlockNumbers()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::PATH:
            SetTypeColumnInt64(bioLatencySampleObj_.FilePathIds()[CurrentRow()], INVALID_UINT64);
            break;
        case Index::DUR_PER_4K:
            SetTypeColumnInt64(bioLatencySampleObj_.DurPer4k()[CurrentRow()], INVALID_UINT64);
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
void BioLatencySampleTable::GetOrbyes(FilterConstraints& biofc, EstimatedIndexInfo& bioei)
{
    auto bioorderbys = biofc.GetOrderBys();
    for (auto i = 0; i < bioorderbys.size(); i++) {
        switch (static_cast<Index>(bioorderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                bioei.isOrdered = false;
                break;
        }
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
