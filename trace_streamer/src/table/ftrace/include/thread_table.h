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

#ifndef SRC_THREAD_TABLE_H
#define SRC_THREAD_TABLE_H

#include "table_base.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class ThreadTable : public TableBase {
public:
    explicit ThreadTable(const TraceDataCache* dataCache);
    ~ThreadTable() override;
    std::unique_ptr<TableBase::Cursor> CreateCursor() override;

private:
    int64_t GetSize() override
    {
        return dataCache_->ThreadSize();
    }
    void GetOrbyes(FilterConstraints& fc, EstimatedIndexInfo& ei) override;
    void FilterByConstraint(FilterConstraints& threadfc,
                            double& threadfilterCost,
                            size_t threadrowCount,
                            uint32_t threadcurrenti) override;
    int32_t Update(int32_t argc, sqlite3_value** argv, sqlite3_int64* pRowid) override;

    class Cursor : public TableBase::Cursor {
    public:
        explicit Cursor(const TraceDataCache* dataCache, TableBase* table);
        ~Cursor() override;
        void FilterIpid(unsigned char op, uint64_t value);
        void FilterTid(unsigned char op, uint64_t value);
        void FilterSwitchCount(unsigned char op, uint64_t value);
        void FilterIndex(int32_t col, unsigned char op, sqlite3_value* argv);
        int32_t Filter(const FilterConstraints& fc, sqlite3_value** argv) override;
        int32_t Column(int32_t col) const override;
        void FilterId(unsigned char op, sqlite3_value* argv) override;

    private:
        void SetNameColumn(const Thread& thread) const;
        template <typename Value, typename Size>
        void HandleIpidConstraint(bool remove,
                                  bool& changed,
                                  Value value,
                                  Size size,
                                  const std::deque<SysTuning::TraceStdtype::Thread>& threadQueue)
        {
            if (remove) {
                for (auto idx = indexMapBack_->rowIndex_.begin(); idx != indexMapBack_->rowIndex_.end();) {
                    if (threadQueue[*idx].switchCount_ != value) {
                        idx++;
                    } else {
                        changed = true;
                        rowIndexBak_.push_back(*idx);
                        idx++;
                    }
                }
                if (changed) {
                    indexMapBack_->rowIndex_ = rowIndexBak_;
                }
            } else {
                for (auto idx = 0; idx < size; idx++) {
                    if (threadQueue[idx].switchCount_ == value) {
                        indexMapBack_->rowIndex_.push_back(idx);
                    }
                }
            }
            indexMapBack_->FixSize();
        }
        template <typename Value, typename Size>
        void HandleSwitchCount(bool remove,
                               bool& isChanged,
                               Value value,
                               Size size,
                               const std::deque<SysTuning::TraceStdtype::Thread>& threadQueue)
        {
            if (remove) {
                for (auto i = indexMapBack_->rowIndex_.begin(); i != indexMapBack_->rowIndex_.end();) {
                    if (threadQueue[*i].internalPid_ != value) {
                        i++;
                    } else {
                        isChanged = true;
                        rowIndexBak_.push_back(*i);
                        i++;
                    }
                }
                if (isChanged) {
                    indexMapBack_->rowIndex_ = rowIndexBak_;
                }
            } else {
                for (auto i = 0; i < size; i++) {
                    if (threadQueue[i].internalPid_ == value) {
                        indexMapBack_->rowIndex_.push_back(i);
                    }
                }
            }
            indexMapBack_->FixSize();
        }
        void HandleIpidConstraint(const std::deque<SysTuning::TraceStdtype::Thread>& threadQueue,
                                  std::size_t size,
                                  bool remove,
                                  bool changed);
        std::vector<TableRowId> rowIndexBak_;
        IndexMap* indexMapBack_ = nullptr;
    };
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // SRC_THREAD_TABLE_H
