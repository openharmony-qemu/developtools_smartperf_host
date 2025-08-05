/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF unknown KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const SpSnapShotViewHtml = `
<div class="chatBox">
   <lit-icon name='close' size = '30' style='position: absolute; top: 5px; right: 5px; cursor: pointer;'></lit-icon>
   <div class="image-container"></div>       
</div>
    <style>
    .chatBox {
        height: 100%;
        width:100%;
        position: relative;
    }
    .image-container {
        display: flex;
        justify-content: center; 
        align-items: center;  
        width:100%;
        height:100%;
        overflow: hidden;
    }
</style>
`;