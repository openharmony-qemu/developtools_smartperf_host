/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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

#include <gtest/gtest.h>
#include <regex>
#include <string>
#include "FileDescriptor.h"
#include "sp_utils.h"
using namespace testing::ext;
using namespace std;

namespace OHOS {
namespace SmartPerf {
class SPdaemonFdsTest : public testing::Test {
public:
    static void SetUpTestCase() {}
    static void TearDownTestCase() {}

    void SetUp() {}
    void TearDown() {}
};

static bool VerifResult(const std::string &result)
{
    int fdTotalInt = 0;
    std::regex fdTotalRegex(R"(fdTotal=(\d+))");
    std::smatch match;
    std::string::const_iterator searchStart(result.cbegin());
    while (std::regex_search(searchStart, result.cend(), match, fdTotalRegex)) {
        std::cout << "Match found: " << match.str(0) << std::endl;
        std::string fdTotalStr  = match.str(1);
        fdTotalInt = std::stoi(fdTotalStr);
        std::cout << "fdTotalInt as integer: " << fdTotalInt << std::endl;
        searchStart = match.suffix().first;
    }
    return fdTotalInt > 0;
}
} // namespace OHOS
} // namespace SmartPerf