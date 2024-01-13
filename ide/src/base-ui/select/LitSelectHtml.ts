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

let listHeight = '';
let css = `
<style>
      :host{
          display: inline-flex;
          position: relative;
          overflow: visible;
          cursor: pointer;
          border-radius: 2px;
          outline: none;
          -webkit-user-select:none ;
          -moz-user-select:none;
          user-select:none;
      }
      :host(:not([border])),
      :host([border='true']){
          border: 1px solid var(--bark-prompt,#dcdcdc);
      }
      input{
          border: 0;
          outline: none;
          background-color: transparent;
          cursor: pointer;
          -webkit-user-select:none ;
          -moz-user-select:none;
          user-select:none;
          display: inline-flex;
          color: var(--dark-color2,rgba(0,0,0,0.9));
      }
      :host([highlight]) input {
          color: rgba(255,255,255,0.9);
      }
      :host([mode])  input{
          padding: 6px 0px;
      }
      :host([mode])  .root{
          padding: 1px 8px;
      }
      .root{
          position: relative;
          padding: 3px 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 2px;
          outline: none;
          font-size: 1rem;
          z-index: 2;
          -webkit-user-select:none ;
          -moz-user-select:none;
          user-select:none;
          width: 100%;
      }
      .body{
          position: absolute;
          bottom: 100%;
          z-index: 99;
          padding-top: 5px;
          margin-top: 2px;
          background-color: var(--dark-background4,#fff);
          width: 100%;
          transform: scaleY(.6);
          visibility: hidden;
          opacity: 0;
          transform-origin: bottom center;
          display: block;
          flex-direction: column;
      }
      .body-bottom{
          bottom: auto;
          top: 100%;
          transform-origin: top center;
      }
      :host([placement="bottom"]) .body{
          bottom:unset;
          top: 100%;
          transition: none;
          transform: none;
      }

      :host([rounded]) .body {
          border-radius: 16px;
      }
      :host([rounded]) .root {
          border-radius: 16px;
          height: 25px;
      }
      .icon{
          pointer-events: none;
      }
      .noSelect{
        -moz-user-select:none;
        -ms-user-select:none;
        user-select:none;
        -khtml-user-select:none;
        -webkit-touch-callout:none;
        -webkit-user-select:none;
      }

      :host(:not([border]):not([disabled]):focus),
      :host([border='true']:not([disabled]):focus),
      :host(:not([border]):not([disabled]):hover),
      :host([border='true']:not([disabled]):hover){
          border:1px solid var(--bark-prompt,#ccc)
      }
      :host(:not([disabled]):focus) .body,
      :host(:not([disabled]):focus-within) .body{
          transform: scaleY(1);
          opacity: 1;
          z-index: 99;
          visibility: visible;
      }
      :host(:not([disabled]):focus)  input{
          color: var(--dark-color,#bebebe);
      }
      :host(:not([border])[disabled]) *,
      :host([border='true'][disabled]) *{
          background-color: var(--dark-background1,#f5f5f5);
          color: #b7b7b7;
          cursor: not-allowed;
      }
      :host([border='false'][disabled]) *{
          color: #b7b7b7;
          cursor: not-allowed;
      }
      :host(:not([mode]))  input{
          width: 100%;
      }
      .body{
          max-height: ${listHeight};
          overflow: auto;
          border-radius: 2px;
          box-shadow: 0 5px 15px 0px #00000033;
      }
      .multipleRoot input::-webkit-input-placeholder {
          color: var(--dark-color,#aab2bd);
      }
      :host(:not([loading])) .loading{
          display: none;
      }
      :host([loading]) .loading{
          display: flex;
      }
      :host(:not([allow-clear])) .clear{
          display: none;
      }
      :host([loading]) .icon{
          display: none;
      }
      :host(:not([loading])) .icon{
          display: flex;
      }
      .clear:hover{
          color: #8c8c8c;
      }
      .clear{
          color: #bfbfbf;
          display: none;
      }
      .multipleRoot{
          display: flex;
          align-items: center;
          flex-flow: wrap;
          flex-wrap: wrap;
          flex-direction: column;
      }
      .search{
          color: #bfbfbf;
          display: none;
      }
      .tag{
          overflow: auto;
          height: auto;
          display: inline-flex;
          position: relative;
          align-items: center;
          font-size: .75rem;
          font-weight: bold;
          padding: 1px 4px;
          margin-right: 4px;
          margin-top: 1px;
          margin-bottom: 1px;
          color: #242424;
          background-color: #f5f5f5;
      }
      .tag-close:hover{
          color: #333;
      }
      .tag-close{
          padding: 2px;
          font-size: .8rem;
          color: #999999;
          margin-left: 0px;
      }
      </style>
`;

export const selectHtmlStr = (height: string): string => {
  listHeight = height;
  return css;
};

export const selectVHtmlStr = `
  <style>
        :host{
            display: inline-flex;
            position: relative;
            overflow: visible;
            cursor: pointer;
            border-radius: 2px;
            outline: none;
            -webkit-user-select:none ;
            -moz-user-select:none;
            user-select:none;
        }
        :host(:not([border])),
        :host([border='true']){
            border: 1px solid var(--bark-prompt,#dcdcdc);
        }
        input{
            border: 0;
            outline: none;
            background-color: transparent;
            cursor: pointer;
            -webkit-user-select:none ;
            -moz-user-select:none;
            user-select:none;
            display: inline-flex;
            color: var(--dark-color2,rgba(0,0,0,0.9));
        }
        :host([highlight]) input {
            color: rgba(255,255,255,0.9);
        }
        :host([mode])  input{
            padding: 6px 0px;
        }
        :host([mode])  .root{
            padding: 1px 8px;
        }
        .root{
            position: relative;
            padding: 3px 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-radius: 2px;
            outline: none;
            font-size: 1rem;
            z-index: 2;
            -webkit-user-select:none ;
            -moz-user-select:none;
            user-select:none;
            width: 100%;
        }
        .body{
            position: absolute;
            bottom: 100%;
            z-index: 99;
            padding-top: 5px;
            margin-top: 2px;
            background-color: var(--dark-background4,#fff);
            width: 100%;
            transform: scaleY(.6);
            visibility: hidden;
            opacity: 0;
            transform-origin: bottom center;
            display: block;
            flex-direction: column;
        }
        .body-bottom{
            bottom: auto;
            top: 100%;
            transform-origin: top center;
        }
        :host([placement="bottom"]) .body{
            bottom:unset;
            top: 100%;
            transition: none;
            transform: none;
        }

        :host([rounded]) .body {
            border-radius: 16px;
        }
        :host([rounded]) .root {
            border-radius: 16px;
            height: 25px;
        }
        .icon{
            pointer-events: none;
        }
        .noSelect{
          -moz-user-select:none;
          -ms-user-select:none;
          user-select:none;
          -khtml-user-select:none;
          -webkit-touch-callout:none;
          -webkit-user-select:none;
        }

        :host(:not([border]):not([disabled]):focus),
        :host([border='true']:not([disabled]):focus),
        :host(:not([border]):not([disabled]):hover),
        :host([border='true']:not([disabled]):hover){
            border:1px solid var(--bark-prompt,#ccc)
        }
        :host(:not([disabled]):focus) .body,
        :host(:not([disabled]):focus-within) .body{
            transform: scaleY(1);
            opacity: 1;
            z-index: 99;
            visibility: visible;
        }
        :host(:not([disabled]):focus)  input{
            color: var(--dark-color,#bebebe);
        }
        :host(:not([border])[disabled]) *,
        :host([border='true'][disabled]) *{
            background-color: var(--dark-background1,#f5f5f5);
            color: #b7b7b7;
            cursor: not-allowed;
        }
        :host([border='false'][disabled]) *{
            color: #b7b7b7;
            cursor: not-allowed;
        }
        .body{
            max-height: 286px;
            box-shadow: 0 5px 15px 0px #00000033;
            border-radius: 10px;
        }
        input{
            width: 100%;
        }
        #search-input {
          outline: none;
          border: none;
        }
        .body-select {
           margin-top: 3px;
           background-color: var(--dark-background4,#fff);
           width: 100%;
           border-bottom: none;
        }
        .body-opt{
            width: 100%;
            max-height: 256px;
            border-top: none;
            overflow: auto;
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
            background-color: var(--dark-background4,#fff);
        }
        .loading{
            display: none;
        }
        input::-webkit-input-placeholder {
                color: var(--dark-color,#aab2bd);
        }
        #search-input{
           margin-left: 15px;
        }
        .icon{
            display: flex;
        }
        /*Define the height, width and background of the scroll bar*/
        ::-webkit-scrollbar
        {
          width: 8px;
          border-radius: 10px;
          background-color: var(--dark-background3,#FFFFFF);
        }

        /*define slider*/
        ::-webkit-scrollbar-thumb
        {
          border-radius: 6px;
          background-color: var(--dark-background7,rgba(0,0,0,0.1));
        }
        
        </style>
        `;
