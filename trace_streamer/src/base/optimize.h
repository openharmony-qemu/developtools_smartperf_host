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

#ifndef SRC_TRACE_BASE_OPTIMIZE_H
#define SRC_TRACE_BASE_OPTIMIZE_H

#if defined(__GNUC__) || defined(__clang__)
#define TS_LIKELY(_x) __builtin_expect(!!(_x), 1)
#define TS_UNLIKELY(_x) __builtin_expect(!!(_x), 0)
#else
#define TS_LIKELY(_x) (_x)
#define TS_UNLIKELY(_x) (_x)
#endif
#if defined(__clang__)
#define TS_INLINE __attribute__((__always_inline__))
#define TS_NO_INLINE __attribute__((__noinline__))
#else
#define TS_INLINE
#define TS_NO_INLINE
#endif
#endif
