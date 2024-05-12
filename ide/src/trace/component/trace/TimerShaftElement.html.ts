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

export const TimerShaftElementHtml = `
<style>
:host{
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: 148px;
    border-bottom: 1px solid var(--dark-background,#dadada);
    border-top: 1px solid var(--dark-background,#dadada);
}
*{
    box-sizing: border-box;
    user-select: none;
}
:host(:not([distributed])) .collect_group{
    display: flex;
}
:host([distributed]) .collect_group{
    display: none;
}
.root{
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-rows: 100%;
    grid-template-columns: 248px 1fr;
    background: var(--dark-background4,#FFFFFF);
}
.total{
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: min-content 1fr;
    background-color: transparent;
}
.panel{
    color: var(--dark-border,#dadada);
    width: 100%;
    height: 100%;
    overflow: visible;
    background-color: var(--dark-background4,#ffffff);
}
.cpu-usage{
    color: var(--dark-color1,#4b5766);
    font-size: 0.9rem;
    text-align: left;
    padding-left: 10px;
    width: 100%;
    background: var(--dark-background4,#F6F6F6);
    box-sizing: border-box;
}
.time-div{
    box-sizing: border-box;
    width: 100%;
    border-top: 1px solid var(--dark-background,#dadada);
    height: 100%;display: flex;justify-content: space-between;
    background-color: var(--dark-background1,white);
    color: var(--dark-color1,#212121);
    font-size: 0.7rem;
    border-right: 1px solid var(--dark-background,#999);
    padding: 2px 6px;
    display: flex;
    justify-content: space-between;
    user-select: none;
    position: relative;
}
.time-total::after{
    content: " +";
}
.time-collect{
    position:absolute;
    right:5px;
    bottom:5px;
    color: #5291FF;
    display: none;
}
.time-collect[close] > .time-collect-arrow{
    transform: rotateZ(-180deg);
}
.collect_group{
    position:absolute;
    right:25px;
    bottom:5px;
    display: flex;
    flex-direction: row;
}
.collect_div{
    display: flex;
    align-items: center;
}

</style>
<div class="root">
    <div class="total">
        <div class="cpu-usage"></div>
        <div class="time-div">
            <span class="time-total">10</span>
            <span class="time-offset">0</span>
            <div class="time-collect">
                <lit-icon class="time-collect-arrow" name="caret-down" size="17"></lit-icon>
            </div>
            <div class="collect_group">
                <div class="collect_div">
                    <input id="collect1" type="radio" style="cursor: pointer" checked name="collect_group" value="1"/>
                    <label>G1</label>
                </div>
                <div class="collect_div">
                    <input type="radio" style="cursor: pointer" name="collect_group" value="2"/>
                    <label>G2</label>
                </div>
            </div>
            <collapse-button expand>123</collapse-button>
        </div>
    </div>
    <canvas class="panel"></canvas>
</div>
`;
