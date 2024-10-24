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
 * WITHOUT WARRANTIES OR CONDITIONS OF unknown KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const SpAdvertisementHtml = `<style>
        #sp-advertisement {
          background-color:#fff;
          display:none;
          max-width: 400px;
          border-radius: 5px;
          border:1px solid galy;
          box-shadow: 0px 0px 10px #d9d9d9;
          cursor: pointer;
          padding:15px 5px 5px 5px;
          font-family: "HarmonyOS Sans SC", "Arial", sans-serif;
        }
        #close { 
          position:absolute;
          right:0px;
          top:0px;
          padding:1px 2px;
          border-top-right-radius:5px;
          color:#999;
        }
        #close:hover {
          background-color:#999;
          color:#666;
          font-weight:bold;
        }
        #notice {
          color:red;
          overflow-wrap: break-word;
          line-height:30px;
          padding-right:15px;
          overflow:hidden;
        }
        
        img {
            max-width:200px;
            max-height:150px;
            vertical-align: top;
        }
        
        span {
            display:inline-block;
        }

        a {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        </style>
        <div class="sp-advertisement" id="sp-advertisement">
            <lit-icon name="close" size="18px" id = "close"></lit-icon>
            <div id="notice"></div>
        </div>
    `;