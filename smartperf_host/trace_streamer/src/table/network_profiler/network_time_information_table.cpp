/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
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

#include "network_time_information_table.h"
#include "log.h"
#include "network_profiler_stdtype.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    ITID,
    IPID,
    BEGIN_TIME,
    DNS_END_TIME,
    TCP_END_TIME,
    TLS_END_TIME,
    FIRST_SEND_TIME,
    FIRST_RECV_TIME,
    END_TIME,
    CACHE_HIT,
};
NetworkTimeInformationTable::NetworkTimeInformationTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("itid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("ipid", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("begin_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("dns_end_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("tcp_end_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("tls_end_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("first_send_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("first_recv_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("end_time", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("cache_hit", "INTEGER"));
    tablePriKey_.push_back("id");
}

NetworkTimeInformationTable::~NetworkTimeInformationTable() {}

std::unique_ptr<TableBase::Cursor> NetworkTimeInformationTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

NetworkTimeInformationTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table,
                        static_cast<uint32_t>(dataCache->GetConstNetworkTimeInformationData().Size())),
      networkTimeInformationDataObj_(dataCache->GetConstNetworkTimeInformationData())
{
}

NetworkTimeInformationTable::Cursor::~Cursor() {}

void NetworkTimeInformationTable::Cursor::HandleIdColumn() const
{
    sqlite3_result_int64(context_, static_cast<int64_t>(networkTimeInformationDataObj_.IdsData()[CurrentRow()]));
}

void NetworkTimeInformationTable::Cursor::HandlePidTidColumn(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ITID:
            sqlite3_result_int64(context_,
                                 static_cast<int64_t>(networkTimeInformationDataObj_.Itids()[CurrentRow()]));
            break;
        case Index::IPID:
            sqlite3_result_int64(context_,
                                 static_cast<int64_t>(networkTimeInformationDataObj_.Ipids()[CurrentRow()]));
            break;
        default:
            break;
    }
}

void NetworkTimeInformationTable::Cursor::HandleTimeColumn(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::BEGIN_TIME:
            sqlite3_result_int64(context_,
                                 static_cast<int64_t>(networkTimeInformationDataObj_.BeginTimes()[CurrentRow()]));
            break;
        case Index::DNS_END_TIME:
            sqlite3_result_int64(context_,
                                 static_cast<int64_t>(networkTimeInformationDataObj_.DnsEndTimes()[CurrentRow()]));
            break;
        case Index::TCP_END_TIME:
            sqlite3_result_int64(
                context_, static_cast<int64_t>(networkTimeInformationDataObj_.TcpConnectEndTimes()[CurrentRow()]));
            break;
        case Index::TLS_END_TIME:
            sqlite3_result_int64(
                context_, static_cast<int64_t>(networkTimeInformationDataObj_.TlsHandshakeEndTimes()[CurrentRow()]));
            break;
        case Index::FIRST_SEND_TIME:
            sqlite3_result_int64(context_,
                                 static_cast<int64_t>(networkTimeInformationDataObj_.FirstSendTimes()[CurrentRow()]));
            break;
        case Index::FIRST_RECV_TIME:
            sqlite3_result_int64(context_,
                                 static_cast<int64_t>(networkTimeInformationDataObj_.FirstRecvTimes()[CurrentRow()]));
            break;
        case Index::END_TIME:
            sqlite3_result_int64(context_,
                                 static_cast<int64_t>(networkTimeInformationDataObj_.EndTimes()[CurrentRow()]));
            break;
        default:
            break;
    }
}

void NetworkTimeInformationTable::Cursor::HandleCacheHitColumn() const
{
    sqlite3_result_int64(context_,
                         static_cast<int64_t>(networkTimeInformationDataObj_.CacheHits()[CurrentRow()]));
}

int32_t NetworkTimeInformationTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            HandleIdColumn();
            break;
        case Index::ITID:
        case Index::IPID:
            HandlePidTidColumn(column);
            break;
        case Index::BEGIN_TIME:
        case Index::DNS_END_TIME:
        case Index::TCP_END_TIME:
        case Index::TLS_END_TIME:
        case Index::FIRST_SEND_TIME:
        case Index::FIRST_RECV_TIME:
        case Index::END_TIME:
            HandleTimeColumn(column);
            break;
        case Index::CACHE_HIT:
            HandleCacheHitColumn();
            break;
        default:
            TS_LOGF("Unregistered networkTimeInformationColumn : %d", column);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning