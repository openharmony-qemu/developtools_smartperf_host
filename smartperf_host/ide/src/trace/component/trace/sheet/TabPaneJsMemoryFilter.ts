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
import { BaseElement, element } from '../../../../base-ui/BaseElement';
import '../../../../base-ui/icon/LitIcon';
import '../../../../base-ui/popover/LitPopoverV';
import '../../../../base-ui/select/LitSelect';
import { TabPaneJsMemoryFilterHtml } from './TabPaneJsMemoryFilter.html';

@element('tab-pane-js-memory-filter')
export class TabPaneJsMemoryFilter extends BaseElement {
  initElements(): void {}

  initHtml(): string {
    return TabPaneJsMemoryFilterHtml;
  }
}
