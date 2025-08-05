/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
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

export const TabPanePowerDetailsHTML = `
        <style>
        .power-details-table{
            height: auto;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <lit-table id="tb-power-details-energy" class="power-details-table">
            <lit-table-column order width="100px" title="" data-index="event" key="event" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="60px" title="UID" data-index="uid" key="uid" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="80px" title="Charge"
            data-index="charge" key="charge" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="200px" title="Foreground Duration(ms)"
            data-index="foreground_duration" key="foreground_duration" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="200px" title="Foreground Energy(mAs)"
            data-index="foreground_energy" key="foreground_energy" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="200px" title="Background Duration(ms)"
            data-index="background_duration" key="background_duration" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="200px" title="Background Energy(mAs)"
            data-index="background_energy" key="background_energy" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="190px" title="Screen On Duration(ms)"
            data-index="screen_on_duration" key="screen_on_duration" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="180px" title="Screen On Energy(mAs)"
            data-index="screen_on_energy" key="screen_on_energy" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="190px" title="Screen Off Duration(ms)"
            data-index="screen_off_duration" key="screen_off_duration" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="190px" title="Screen Off Energy(mAs)"
            data-index="screen_off_energy" key="screen_off_energy" align="flex-start" >
            </lit-table-column>
             <lit-table-column order width="150px" title="Foreground Count"
             data-index="foreground_count" key="foreground_count" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="150px" title="Background Count"
            data-index="background_count" key="background_count" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="150px" title="Screen On Count"
            data-index="screen_on_count" key="screen_on_count" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="150px" title="Screen Off Count"
            data-index="screen_off_count" key="screen_off_count" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="170px" title="Background Time(ms)"
            data-index="background_time" key="background_time" align="flex-start">
            </lit-table-column>
            <lit-table-column order width="160px" title="Screen On Time(ms)"
            data-index="screen_on_time" key="screen_on_time" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="160px" title="Screen Off Time(ms)"
            data-index="screen_off_time" key="screen_off_time" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="110px" title="Energy(mAs)" 
            data-index="energy" key="energy" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="80px" title="Load(%)"
            data-index="load" key="load" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="100px" title="Usage(ms)"
            data-index="usage" key="usage" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="120px" title="Duration(ms)"
            data-index="duration" key="duration" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="100px" title="Camera Id"
            data-index="camera_id" key="camera_id" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="80px" title="Count"
            data-index="count" key="count" align="flex-start" >
            </lit-table-column>
            <lit-table-column order width="140px" title="Energy Percent(%)"
            data-index="energyConsumptionRatio" key="energyConsumptionRatio" align="flex-start" >
            </lit-table-column>
        </lit-table>`;
