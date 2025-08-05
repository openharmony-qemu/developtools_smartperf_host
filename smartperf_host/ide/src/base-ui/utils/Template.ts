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

const propsMap: string[] = ['disabled', 'hidden', 'checked', 'selected', 'required', 'open', 'readonly'];

declare interface HTMLTemplateElement {
  render(data: unknown): unknown;
}
//@ts-ignore
(HTMLTemplateElement as unknown).prototype.render = function (data: unknown): HTMLElement {
  if (!this.$fragment) {
    const rule = this.getAttribute('rule') || 'v-';
    this.$fragment = this.cloneNode(true);
    this.fragment = document.createElement('TEMPLATE');

    // v-for Loop rendering
    // <div v-for="list"></div>   =>    ${ list.map(function(item,index){ return '<div></div>' }).join('') }
    const repeatEls = this.$fragment.content.querySelectorAll(`[\\${rule}for]`);
    repeatEls.forEach((el: unknown) => {
      //@ts-ignore
      const strFor = el.getAttribute(`${rule}for`);
      const { isArray, items, params } = parseFor(strFor); //@ts-ignore
      el.before(
        '${Object.entries(' +
          items +
          ').map(function([' +
          `${isArray ? '$index$' : params[1] || 'name'},${params[0] || (isArray ? 'item' : 'value')}],${
            params[2] || 'index'
          }` +
          '){ return `'
      ); //@ts-ignore
      el.removeAttribute(`${rule}for`); //@ts-ignore
      el.after('`}).join("")}');
    });

    // v-if Conditional rendering
    // <div v-if="if"></div>   =>    ${ if ? '<div></div>' : '' }
    const ifEls = this.$fragment.content.querySelectorAll(`[\\${rule}if]`);
    ifEls.forEach((el: unknown) => {
      //@ts-ignore
      const ifs = el.getAttribute(`${rule}if`); //@ts-ignore
      el.before('${' + ifs + '?`'); //@ts-ignore
      el.removeAttribute(`${rule}if`); //@ts-ignore
      el.after('`:`<!--if:' + el.tagName + '-->`}');
    });

    // fragment   <fragment>aa</fragment>   =>  aa
    const fragments = this.$fragment.content.querySelectorAll('fragment,block');
    fragments.forEach((el: unknown) => {
      //@ts-ignore
      el.after(el.innerHTML); //@ts-ignore
      el.parentNode.removeChild(el);
    });
  }
  this.fragment.innerHTML = this.$fragment.innerHTML.interpolate(data);

  // props
  const propsEls = this.fragment.content.querySelectorAll(`[${propsMap.join('],[')}]`);
  propsEls.forEach((el: unknown) => {
    propsMap.forEach((props: unknown) => {
      // If these attribute values are false, they are removed directly
      //@ts-ignore
      if (el.getAttribute(props) === 'false') {
        //@ts-ignore
        el.removeAttribute(props);
      }
    });
  });
  return this.fragment;
};

function parseFor(strFor: String): { isArray: boolean; items: string | String; params: string[] } {
  // Whether it is an object
  const isObject = strFor.includes(' of ');
  const reg = /\s(?:in|of)\s/g;
  const [keys, obj] = strFor.match(reg) ? strFor.split(reg) : ['item', strFor];
  const items = Number(obj) > 0 ? `[${'null,'.repeat(Number(obj) - 1)}null]` : obj;
  const params = keys.split(/[\(|\)|,\s?]/g).filter(Boolean);
  return { isArray: !isObject, items, params };
}

// String to template string
//@ts-ignore
(String as unknown).prototype.interpolate = function (params: unknown): Function {
  //@ts-ignore
  const names = Object.keys(params);
  // @ts-ignore
  const vals = Object.values(params);
  const str = this.replace(/\{\{([^\}]+)\}\}/g, (all: unknown, s: unknown) => `\${${s}}`);
  // @ts-ignore
  return new Function(...names, `return \`${escape2Html(str)}\`;`)(...vals);
};

// HTML Character inversion meaning   &lt;  =>  <
function escape2Html(str: string): string {
  let arrEntities: unknown = { lt: '<', gt: '>', nbsp: ' ', amp: '&', quot: '"' };
  return str.replace(/&(lt|gt|nbsp|amp|quot);/gi, function (all, t) {
    //@ts-ignore
    return arrEntities[t];
  });
}

export function replacePlaceholders(str: string, ...args: string[]): string {
  return str.replace(/\{(\d+)\}/g, (match, placeholderIndex) => {
    const argIndex = parseInt(placeholderIndex, 10);
    const replacement = args[argIndex - 1];
    return replacement || match;
  });
}
