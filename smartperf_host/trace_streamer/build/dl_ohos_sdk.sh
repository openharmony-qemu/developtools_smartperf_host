#!/bin/bash
# Copyright (c) Huawei Technologies Co., Ltd. 2025. All rights reserved.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
set -e
function dl_ohos_sdk() {
    if [ ! -d "tools/ohos-sdk" ];then
        echo "you need ohos-sdk to compile ohos"
        if [ ! -d "tools" ];then
            mkdir tools
        fi
        if [ ! -d "tools/gcc-linaro-7.5.0-2019.12-x86_64_aarch64-linux-gnu" ];then
            curl https://repo.huaweicloud.com/openharmony/compiler/prebuilts_gcc_linux-x86_arm_gcc-linaro-7.5.0-arm-linux-gnueabi/1.0/gcc-linaro-7.5.0-2019.12-x86_64_aarch64-linux-gnu.tar.xz --output gcc-linaro-7.5.0-2019.12-x86_64_aarch64-linux-gnu.tar.xz
            tar Jxvf gcc-linaro-7.5.0-2019.12-x86_64_aarch64-linux-gnu.tar.xz --directory=tools/
        fi
        if [ ! -d "tools/prebuilts_gcc_linux-x86_arm_gcc-linaro-7.5.0-arm-linux-gnueabi" ];then
            curl https://repo.huaweicloud.com/openharmony/compiler/prebuilts_gcc_linux-x86_arm_gcc-linaro-7.5.0-arm-linux-gnueabi/1.0/prebuilts_gcc_linux-x86_arm_gcc-linaro-7.5.0-arm-linux-gnueabi.tar.gz --output gcc-linaro-7.5.0-arm-linux-gnueabi.tar.gz
            tar zxvf gcc-linaro-7.5.0-arm-linux-gnueabi.tar.gz --directory=tools/
        fi
        if [ ! -d "tools/ohos-sdk" ];then
            curl -L https://repo.huaweicloud.com/harmonyos/os/7.0-Release/ohos-sdk-windows_linux-public.tar.gz --output ohos-sdk-windows_linux-public.tar.gz
            mkdir -p tools/ohos-sdk
            tar zxvf ohos-sdk-windows_linux-public.tar.gz --directory=tools/ohos-sdk/
            if [ -d "tools/ohos-sdk/linux" ]; then
                cd tools/ohos-sdk/linux
                for zipfile in *.zip; do
                    [ -f "$zipfile" ] || continue
                    echo "unzip:$zipfile"
                    unzip -o "$zipfile"
                done
                cd -
            elif [ -d "tools/ohos-sdk/ohos-sdk/linux" ]; then
                mv tools/ohos-sdk/ohos-sdk/* tools/ohos-sdk/
                rmdir tools/ohos-sdk/ohos-sdk
                cd tools/ohos-sdk/linux
                for zipfile in *.zip; do
                    [ -f "$zipfile" ] || continue
                    echo "unzip:$zipfile"
                    unzip -o "$zipfile"
                done
                cd -
            fi
            mkdir -p tools/ohos-sdk/linux/native/sysroot/usr/lib/aarch64-linux-ohos
            mkdir -p tools/ohos-sdk/linux/native/sysroot/usr/lib/arm-linux-ohos
            cp tools/gcc-linaro-7.5.0-2019.12-x86_64_aarch64-linux-gnu/lib/gcc/aarch64-linux-gnu/7.5.0/libgcc.a tools/ohos-sdk/linux/native/sysroot/usr/lib/aarch64-linux-ohos
            cp tools/prebuilts_gcc_linux-x86_arm_gcc-linaro-7.5.0-arm-linux-gnueabi/lib/gcc/arm-linux-gnueabi/7.5.0/libgcc.a tools/ohos-sdk/linux/native/sysroot/usr/lib/arm-linux-ohos
        fi
    fi
}
function prepare_ohos() {
    local ohos_target="${1:-ohos}"
    if [ ! -e "out/linux/protoc" ]; then
        echo "out/linux/protoc not found, need to build:"
        ./build.sh linux -m addr2line
    fi
    if [ ! -d "out/$ohos_target" ]; then
        mkdir -p "out/$ohos_target"
    fi
    if [ ! -d "out/${ohos_target}_debug" ]; then
        mkdir -p "out/${ohos_target}_debug"
    fi
    rm -rf "out/$ohos_target/gen" "out/${ohos_target}_debug/gen/"
    cp -rf out/linux/gen "out/$ohos_target/"
    cp -rf out/linux/gen "out/${ohos_target}_debug/"
    dl_ohos_sdk
}