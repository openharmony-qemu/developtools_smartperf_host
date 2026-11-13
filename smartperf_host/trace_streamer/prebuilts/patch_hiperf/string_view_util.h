/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
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
#ifndef STRING_VIEW_UTIL_H
#define STRING_VIEW_UTIL_H

#include <cstdio>
#include <string>
#include <securec.h>
#include <vector>
#include <pthread.h>
#include "cpp_define.h"

namespace OHOS {
namespace HiviewDFX {
#ifdef is_mac
class SpinLock {
public:
    void lock()
    {
        while (locked_.test_and_set(std::memory_order_acquire))
            ;
    }
    void unlock()
    {
        locked_.clear(std::memory_order_release);
    }

private:
    std::atomic_flag locked_ = ATOMIC_FLAG_INIT;
};
#endif
class StringViewHold {
public:
    static StringViewHold &Get()
    {
        static StringViewHold instance;
        return instance;
    }

    const char *Hold(STRING_VIEW view)
    {
#ifndef is_mac
        pthread_spin_lock(&spin_lock_);
#else
        std::lock_guard<SpinLock> lockGurand(spinlock_);
#endif
        if (view.size() == 0) {
#ifndef is_mac
            pthread_spin_unlock(&spin_lock_);
#endif
            return "";
        }

        char *p = new (std::nothrow) char[view.size() + 1];
        if (p == nullptr) {
#ifndef is_mac
            pthread_spin_unlock(&spin_lock_);
#endif
            return "";
        }
        if (memset_s(p, view.size() + 1, '\0', view.size() + 1) != 0) {
#ifndef is_mac
            pthread_spin_unlock(&spin_lock_);
#endif
            return "";
        }
        std::copy(view.data(), view.data() + view.size(), p);
        views_.emplace_back(p);
#ifndef is_mac
        pthread_spin_unlock(&spin_lock_);
#endif
        return p;
    }

    // only use in UT
    void Clean()
    {
#ifndef is_mac
        pthread_spin_lock(&spin_lock_);
#else
        std::lock_guard<SpinLock> lockGurand(spinlock_);
#endif
        for (auto &p : views_) {
            delete[] p;
        }
        views_.clear();
#ifndef is_mac
        pthread_spin_unlock(&spin_lock_);
#endif
    }

private:
#ifndef is_mac
    StringViewHold()
    {
        pthread_spin_init(&spin_lock_, PTHREAD_PROCESS_PRIVATE);
    }
#endif
    ~StringViewHold()
    {
        Clean();
#ifndef is_mac
        pthread_spin_destroy(&spin_lock_);
#endif
    }

    std::vector<char *> views_;
#ifndef is_mac
    pthread_spinlock_t spin_lock_;
#else
    SpinLock spinlock_;
#endif
};
} // namespace HiviewDFX
} // namespace OHOS
#endif