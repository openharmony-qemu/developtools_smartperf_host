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
export class IrqAndSoftirqBean {
    cat: string = '';
    name: string = '';
    callid: number = 0;
    count: number = 0;
    isFirstObject: number = 1;
    startTime: number = 0;
    endTime: number = 0;
    wallDuration: number = 0;
    priority: number = 0;
}

export class byCallidGroupBean {
    Callid: IrqAndSoftirqBean[] = [];
}

export class finalResultBean {
    cat: string = '';
    wallDuration: number = 0;
    maxDuration?: number = 0;
    name: string = '';
    count: number = 0;
    avgDuration?: number | string;
    wallDurationFormat?: number | string;
    maxDurationFormat?: number | string;
}