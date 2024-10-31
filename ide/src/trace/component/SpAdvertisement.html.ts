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
          position: absolute;  
          bottom: -200px;
          transform: translateX(-50%);
          opacity: 0;
          animation: slideUpVerticalAndFadeIn 1.5s forwards ease-out;
          background-color:#fff;
          display:none;
          min-width: 400px;
          border-radius: 5px;
          border:1px solid gray;
          box-shadow: 0px 0px 10px #d9d9d9;
          cursor: pointer;
          padding:15px 5px 5px 5px;
          font-family: "HarmonyOS Sans SC", "Arial", sans-serif;
        }
        @keyframes slideUpVerticalAndFadeIn  {  
           0% {  
             bottom: -200px;
             opacity: 0;
           }  
           100% {  
            bottom: 0;
            transform: translateX(-100%);
            opacity: 1;
          }  
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
          display: flex;  
          align-items: center;
          color:#000;
          overflow-wrap: break-word;
          line-height:30px;
          padding-right:15px;
          overflow:hidden;
        }
        
        img {
          flex-grow: 1;  
          flex-basis: 0;  
          max-width: 20%; 
          object-fit: cover;
        }
        .text {  
            flex-grow: 2;  
            padding-left: 10px;  
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
            <div id="notice">
              <img src="img/logo.png" alt="Description" class="image" id="Image">
              <div class="text"></div>
            </div>
        </div>
    `;