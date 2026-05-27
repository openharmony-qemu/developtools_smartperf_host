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

#include "network_information_table.h"
#include "log.h"
#include "network_profiler_stdtype.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    REQUEST_ID,
    PROTOCOL,
    DOMAIN,
    REQUEST_URI,
    REQUEST_METHOD,
    REQUEST_HEADER,
    RESPONSE_STATUS_CODE,
    RESPONSE_HEADER,
    RESPONSE_EFFECTIVE_URL,
    IP_ADDRESS,
    VERSION,
    REASON_PHRASE,
};
NetworkInformationTable::NetworkInformationTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("request_id", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("protocol", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("domain", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("request_uri", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("request_method", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("request_header", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("response_status_code", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("response_header", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("response_effective_url", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("ip_address", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("version", "TEXT"));
    tableColumn_.push_back(TableBase::ColumnInfo("reason_phrase", "TEXT"));
    tablePriKey_.push_back("id");
}

NetworkInformationTable::~NetworkInformationTable() {}

std::unique_ptr<TableBase::Cursor> NetworkInformationTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

NetworkInformationTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table,
                        static_cast<uint32_t>(dataCache->GetConstNetworkInformationData().Size())),
      networkInformationDataObj_(dataCache->GetConstNetworkInformationData())
{
}

NetworkInformationTable::Cursor::~Cursor() {}

void NetworkInformationTable::Cursor::HandleIdColumn() const
{
    sqlite3_result_int64(context_, static_cast<int64_t>(networkInformationDataObj_.IdsData()[CurrentRow()]));
}

void NetworkInformationTable::Cursor::HandleTextColumn(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::REQUEST_ID:
            sqlite3_result_text(context_, networkInformationDataObj_.RequestIds()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::PROTOCOL:
            sqlite3_result_text(context_, networkInformationDataObj_.Protocols()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::DOMAIN:
            sqlite3_result_text(context_, networkInformationDataObj_.Domains()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::REQUEST_URI:
            sqlite3_result_text(context_, networkInformationDataObj_.RequestUris()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::REQUEST_METHOD:
            sqlite3_result_text(context_, networkInformationDataObj_.RequestMethods()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::REQUEST_HEADER:
            sqlite3_result_text(context_, networkInformationDataObj_.RequestHeaders()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::RESPONSE_HEADER:
            sqlite3_result_text(context_, networkInformationDataObj_.ResponseHeaders()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::RESPONSE_EFFECTIVE_URL:
            sqlite3_result_text(context_, networkInformationDataObj_.ResponseEffectiveUrls()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::IP_ADDRESS:
            sqlite3_result_text(context_, networkInformationDataObj_.IpAddresses()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::VERSION:
            sqlite3_result_text(context_, networkInformationDataObj_.HttpVersions()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        case Index::REASON_PHRASE:
            sqlite3_result_text(context_, networkInformationDataObj_.ResponseReasonPhrases()[CurrentRow()].c_str(),
                                 STR_DEFAULT_LEN, nullptr);
            break;
        default:
            break;
    }
}

void NetworkInformationTable::Cursor::HandleIntColumn(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::RESPONSE_STATUS_CODE:
            sqlite3_result_int64(
                context_, static_cast<int64_t>(networkInformationDataObj_.ResponseStatusCodes()[CurrentRow()]));
            break;
        default:
            break;
    }
}

int32_t NetworkInformationTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            HandleIdColumn();
            break;
        case Index::REQUEST_ID:
        case Index::PROTOCOL:
        case Index::DOMAIN:
        case Index::REQUEST_URI:
        case Index::REQUEST_METHOD:
        case Index::REQUEST_HEADER:
        case Index::RESPONSE_HEADER:
        case Index::RESPONSE_EFFECTIVE_URL:
        case Index::IP_ADDRESS:
        case Index::VERSION:
        case Index::REASON_PHRASE:
            HandleTextColumn(column);
            break;
        case Index::RESPONSE_STATUS_CODE:
            HandleIntColumn(column);
            break;
        default:
            TS_LOGF("Unregistered networkInformationColumn : %d", column);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning