为了方便传输此sdk开发包，位于prebuilts目录下的emsdk目录已经被删除，可以通过下面的
为了编译WebAssembly版本，需要在prebuilts/目录下安装emsdk
```
git clone https://github.com/juj/emsdk.git --depth=1
cd emsdk
git pull
./emsdk update # this may not work, ignore it
./emsdk install latest
./emsdk activate latest
之后调用
```
./build.sh sdkdemo 进行编译demo
```