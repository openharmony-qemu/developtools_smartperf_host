# 执行FUZZ测试用例
    cd /data/local/tmp/FuzzTest
    ./hiprofiler_ts_bytrace_fuzz_test -max_total_time=20
    ./hiprofiler_ts_htrace_fuzz_test -max_total_time=20
    ./hiprofiler_ts_selector_fuzz_test -max_total_time=20

# 可能遇到的问题
    1. 执行测试用例过程中报“cannot merge previous GCDA ”。
        在开发板上进入代码根目录，执行以下命令：
        find . -name "*.gcda" -print0 | xargs -0 rm
