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
import { BaseElement } from '../../../../base-ui/BaseElement';
import { SpSystemTrace } from '../../SpSystemTrace';
export class ShadowRootInput {
    public static preventBubbling(page: BaseElement | Element): void {
        let pageInputList = ShadowRootInput.findInputListInShadowDOM(page);
        let sp = document?.querySelector('body > sp-application')?.shadowRoot?.querySelector('#sp-system-trace') as SpSystemTrace;
        pageInputList.forEach(input => {
            input.addEventListener('focus', (e) => {
                sp.keyboardEnable = false;
            });
            input.addEventListener('blur', (e) => {
                sp.keyboardEnable = true;
            });
        });
    }
    public static findInputListInShadowDOM(page: BaseElement | Element | null): Element[] {
        let queue: (Element | null)[] = [page];
        let inputList: Element[] = [];
        while (queue.length > 0) {
            let currentNode = queue.shift(); // 从队列中取出一个节点  
            if (!currentNode) { continue };
            if (currentNode.tagName === 'INPUT') {
                inputList.push(currentNode);
            }
            if (currentNode.shadowRoot) {
                Array.from(currentNode.shadowRoot.children).forEach(child => {
                    queue.push(child);
                });
            }
            Array.from(currentNode.children).forEach(child => {
                queue.push(child);
            });
        }
        // 返回所有找到的input元素  
        return inputList;
    }
}