/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
const os = require('os');
const path = require('path');

const isWindows = process.platform === 'win32';
const exeSuffix = isWindows ? '.exe' : '';
const binDir = path.join(__dirname, 'bin');

module.exports = {
    isWindows,
    platform: process.platform,
    objdumpPath: path.join(binDir, 'objdump' + exeSuffix),
    addr2linePath: path.join(binDir, 'addr2line' + exeSuffix),
    searchCmd: isWindows ? 'findstr' : 'grep',
    tempDir: isWindows ? 'C:\\' : os.tmpdir(),
    splitLines(text) {
        return text.split(/\r?\n/);
    }
};
