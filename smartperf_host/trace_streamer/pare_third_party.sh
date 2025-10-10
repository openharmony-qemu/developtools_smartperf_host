#!/bin/bash
# Copyright (c) Huawei Technologies Co., Ltd. 2023. All rights reserved.
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
patch='patch'
sed='sed'
cp='cp'
rm='rm'
root_dir=$(pwd)
echo "build root dir is $root_dir"

git config --global core.longpaths true
case "$OSTYPE" in
  darwin*)  sed="gsed" ;;
esac
if [ ! -d "third_party" ];then
    mkdir third_party
fi
cd third_party

if [ ! -f "sqlite/BUILD.gn" ];then
    git clone git@gitee.com:openharmony/third_party_sqlite.git sqlite
    cd sqlite
    git reset --hard d21e412dbc6f2cdde2e4c9828e2450fcfca4fbe9
    cd ..
fi

if [ ! -f "protobuf/BUILD.gn" ];then
    git clone git@gitee.com:openharmony/third_party_protobuf.git protobuf
    cd protobuf
    git reset --hard aceafed4cf26d7a6be8169ae887cc13b749d5515
    cd ..
fi

if [ ! -f "zlib/BUILD.gn" ];then
    git clone --depth=1 git@gitee.com:openharmony/third_party_zlib.git zlib
fi

if [ ! -f "bzip2/BUILD.gn" ];then
    git clone --depth=1 git@gitee.com:openharmony/third_party_bzip2.git bzip2
fi

if [ ! -f "googletest/BUILD.gn" ];then
    git clone --depth=1 git@gitee.com:openharmony/third_party_googletest.git googletest
fi

if [ ! -d "json" ];then
    git clone --depth=1 git@gitee.com:openharmony/third_party_json.git json
fi

if [ ! -d "libbpf" ];then
    git clone --depth=1 git@gitee.com:openharmony/third_party_libbpf.git libbpf
fi

if [ ! -d "hiviewdfx/faultloggerd" ];then
   git clone --depth=1 git@gitee.com:openharmony/hiviewdfx_faultloggerd.git hiviewdfx/faultloggerd/
   cd hiviewdfx/faultloggerd
   perl -pi -e 's/\r$//' interfaces/innerkits/unwinder/src/elf/dfx_elf.cpp
   $patch -p1  < ../../../prebuilts/patch_hiperf/hiviewdfx_faultloggerd.patch
   cd ../../
fi

if [ ! -f "hiperf/BUILD.gn" ];then
    git clone --depth=1 git@gitee.com:openharmony/developtools_hiperf.git hiperf
    cd hiperf
    $patch -p1  < ../../prebuilts/patch_hiperf/hiperf.patch
    cd ..
fi

if [ ! -f "bounds_checking_function/BUILD.gn" ];then
    git clone --depth=1 git@gitee.com:openharmony/third_party_bounds_checking_function.git bounds_checking_function
fi

if [ ! -d "commonlibrary/c_utils" ];then
    git clone --depth=1 git@gitee.com:openharmony/commonlibrary_c_utils.git commonlibrary/c_utils
fi

if [ ! -d "profiler" ];then
    git clone --depth=1 git@gitee.com:openharmony/developtools_profiler.git profiler
fi

if [ ! -d "llvm-project" ];then
    rm -rf llvm-project
    git clone --depth=1 https://gitee.com/openharmony/third_party_llvm-project.git
    if [ -d "third_party_llvm-project" ];then
        mv third_party_llvm-project llvm-project
        cd llvm-project
        $patch -p1 < ../../prebuilts/patch_llvm/llvm.patch
        cd $root_dir
        # Symbolic link llvm sub folder of llvm-project source code to build root.
        # REF: https://gitee.com/openharmony/third_party_llvm-project/blob/master/llvm/utils/gn/.gn
        ln -s $root_dir/third_party/llvm-project/llvm llvm
    fi
fi
