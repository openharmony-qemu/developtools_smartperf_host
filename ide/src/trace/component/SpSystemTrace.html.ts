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

export const SpSystemTraceHtml = `<!--suppress CssUnresolvedCustomProperty -->
    <style>
    :host{
        display: block;
        width: 100%;
        height: 100%;
    }
    .timer-shaft{
        width: 100%;
        z-index: 2;
    }
    
     .rows-pane{
        overflow: overlay;
        overflow-anchor: none;
        flex: 1;
        max-height: calc(100vh - 147px - 48px);
    }
    .rows{
        color: #fff;
        display: flex;
        box-sizing: border-box;
        flex-direction: column;
        overflow-y: auto;
        flex: 1;
        width: 100%;
        background: var(--dark-background4,#ffffff);
    }
    :host([disable]) .vessel{
        pointer-events: none;
    }
    .vessel{
        width: 100%;
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        position:relative;
    }
    .panel-canvas{
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        z-index: 0;
    }
    
    .panel-canvas-favorite{
        width: 100% ;
        display: block;
        position: absolute;
        height: 0;
        top: 0;
        right: 0;
        box-sizing: border-box;
        z-index: 100;
    }
    .trace-sheet{
        cursor: default;
    }
    .tip{
        z-index: 1001;
        position: absolute;
        top: 0;
        left: 0;
        /*height: 100%;*/
        background-color: white;
        border: 1px solid #f9f9f9;
        width: auto;
        font-size: 8px;
        color: #50809e;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        padding: 2px 10px;
        box-sizing: border-box;
        display: none;
        user-select: none;
    }

    </style>
    <div class="vessel">
        <timer-shaft-element class="timer-shaft" style="position: relative;top: 0"></timer-shaft-element>
        <sp-chart-list id="favorite-chart-list"></sp-chart-list>
        <div class="rows-pane" style="position: relative;flex-direction: column;overflow-x: hidden;">
            <canvas id="canvas-panel" class="panel-canvas" ondragstart="return false"></canvas>
            <div class="spacer" ondragstart="return false"></div>
            <div class="rows" ondragstart="return false"></div>
        </div>
        <div id="tip" class="tip"></div>
        <trace-sheet class="trace-sheet" mode="hidden" ondragstart="return false"></trace-sheet>
    </div>
        `;
