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

export class PageNation {
  element: unknown;
  pageInfo: unknown;
  first: unknown;
  prev: unknown;
  next: unknown;
  last: unknown;
  inputBox: unknown;
  btn: unknown;
  list: unknown;
  origin: HTMLElement | undefined;
  static BtnBackColor = '#6C9BFA';
  static BtnColor = '#fff';
  constructor(selector: unknown, options = {}) {
    // @ts-ignore
    selector!.innerHTML = '';
    //最大容器
    this.element = selector;
    // 默认值
    this.pageInfo = {
      current: 1,
      total: 100,
      pageSize: 15,
    };
    //等待创建的元素
    this.first = null;
    this.prev = null;
    this.next = null;
    this.last = null;
    // 输入框
    this.inputBox = null;
    // 跳转按钮
    this.btn = null;
    // 中间的按钮组
    this.list = null;
    this.setPageOptions(options);
    this.setItemStyles();
    this.createPageElement();
    this.bindPageHtml();
    this.bindPageEvent();
  }

  setPageOptions(options: unknown): void {
    // 当前页
    // @ts-ignore
    this.pageInfo.current = options.current || 1;
    // 一页显示多少条
    // @ts-ignore
    this.pageInfo.pageSize = options.pageSize || 15; // @ts-ignore
    if (options.totalpage) {
      //用户传递了多少页
      // @ts-ignore
      this.pageInfo.totalpage = options.totalpage;
    } else {
      //没有传递多少页
      // @ts-ignore
      if (options.total) {
        // 如果传递了总条数
        // @ts-ignore
        this.pageInfo.totalpage = Math.ceil(options.total / this.pageInfo.pageSize);
      } else {
        // 如果没有传递总条数
        // @ts-ignore
        this.pageInfo.totalpage = 9;
      }
    } // @ts-ignore
    this.pageInfo.first = options.first || '<<';
    // @ts-ignore
    this.pageInfo.change = options.change || function (): void {};
  }

  setElementStyles(ele: unknown, styles: unknown): void {
    // @ts-ignore
    for (let key in styles) {
      // @ts-ignore
      ele.style[key] = styles[key];
    }
  }

  setItemStyles(): void {
    this.setElementStyles(this.element, {
      margin: '18px auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
  }

  createElement(jumpDiv: HTMLElement): void {
    // Create input field
    this.inputBox = document.createElement('input'); // @ts-ignore
    this.inputBox.value = this.pageInfo.current;
    this.setElementStyles(this.inputBox, {
      width: '35px',
      height: '30px',
      textAlign: 'center',
      outline: 'none',
      padding: '0',
      border: '0',
      'border-radius': '5px',
    }); // @ts-ignore
    jumpDiv.appendChild(this.inputBox);
    let span = document.createElement('span');
    span.style.width = '1px';
    span.style.height = '24px';
    span.style.alignSelf = 'center';
    span.style.backgroundColor = '#999999';
    jumpDiv.appendChild(span);
    // Create button
    this.btn = document.createElement('button'); // @ts-ignore
    this.btn.innerText = ''; // @ts-ignore
    this.btn.name = 'goto';
    this.setElementStyles(this.btn, {
      height: '32px',
      width: '30px',
      cursor: 'pointer',
      backgroundColor: '#FFF',
      border: '0',
      'border-radius': '5px',
    }); // @ts-ignore
    this.btn.style.background = 'url("img/arrowright.png") no-repeat 98% center var(--dark-background3,#FFFFFF)'; // @ts-ignore
    this.btn.style.backgroundPosition = 'center'; // @ts-ignore
    jumpDiv.appendChild(this.btn); // @ts-ignore
    this.element.appendChild(jumpDiv);
  }

  // 创建元素 首页 上一页 按钮组  下一页 尾页 输入框 按钮
  createPageElement(): void {
    //首页
    this.origin = document.createElement('p');
    this.setElementStyles(this.origin, {
      'border-radius': '4px',
      padding: '5px',
      border: '1px solid rgba(0,0,0,0.6)',
      cursor: 'pointer',
      margin: '0 5px',
    });
    this.first = this.origin.cloneNode(true); // @ts-ignore
    this.first.innerText = this.pageInfo.first; // @ts-ignore
    this.first.name = 'first'; // @ts-ignore
    this.element.appendChild(this.first);
    this.prev = this.origin.cloneNode(true); // @ts-ignore
    this.prev.innerText = '<'; // @ts-ignore
    this.prev.name = 'prev'; // @ts-ignore
    this.prev.style.padding = '5px 10px'; // @ts-ignore
    this.element.appendChild(this.prev);
    // 创建ul
    this.list = document.createElement('ul');
    this.setElementStyles(this.list, {
      display: 'flex',
      padding: '0',
    }); // @ts-ignore
    this.element.appendChild(this.list);
    this.next = this.origin.cloneNode(true); // @ts-ignore
    this.next.innerText = '>'; // @ts-ignore
    this.next.name = 'next'; // @ts-ignore
    this.next.style.padding = '5px 10px'; // @ts-ignore
    this.next.style.margin = '0px 5px'; // @ts-ignore
    this.element.appendChild(this.next);
    this.last = this.origin.cloneNode(true); // @ts-ignore
    this.last.innerText = '>>'; // @ts-ignore
    this.last.name = 'last'; // @ts-ignore
    this.last.style.padding = '5px'; // @ts-ignore
    this.last.style.margin = '0px 5px'; // @ts-ignore
    this.element.appendChild(this.last);
    let jumpDiv = document.createElement('div');
    jumpDiv.style.display = 'flex';
    jumpDiv.style.border = '1px solid rgba(0,0,0,0.6)';
    jumpDiv.style.borderRadius = '4px';
    jumpDiv.style.width = '70px';
    jumpDiv.style.height = '32px';
    jumpDiv.style.marginLeft = '10px';

    this.createElement(jumpDiv);
  }

  // 判断首页 上一页 下一页 尾页 是否可以点击
  bindPageHtml(): void {
    // @ts-ignore
    const { current, totalpage } = this.pageInfo;
    const disable = { color: '#999999', cursor: 'not-allowed' };
    const enable = {
      color: '#000',
      cursor: 'pointer',
    };
    // 判断当前页是否是第一页  如果是第一页  那么首页和上一页就不能点击
    if (current <= 1) {
      this.setElementStyles(this.first, disable);
      this.setElementStyles(this.prev, disable);
    } else {
      this.setElementStyles(this.first, enable);
      this.setElementStyles(this.prev, enable);
    }
    // 判断当前页是否是最后一页  如果是最后一页  那么下一页和尾页就不能点击
    if (current >= totalpage) {
      this.setElementStyles(this.next, disable);
      this.setElementStyles(this.last, disable);
    } else {
      this.setElementStyles(this.next, enable);
      this.setElementStyles(this.last, enable);
    } // @ts-ignore
    this.inputBox.value = current;
    //渲染的时候判断ul列表的显示情况
    this.bindPageList(); // @ts-ignore
    this.pageInfo.change(this.pageInfo.current);
  }

  bindPageList(): void {
    // @ts-ignore
    this.list.innerHTML = ''; // clear ul its contents
    // @ts-ignore
    const { pageSize, current, totalpage } = this.pageInfo; //Clean the ul before each load
    const origin = document.createElement('li');
    origin.dataset.name = 'item';
    this.setElementStyles(origin, {
      listStyle: 'none',
      'border-radius': '4px',
      border: '1px solid rgba(0,0,0,0.6)',
      padding: '5px 10px',
      margin: '0 5px',
      cursor: 'pointer',
    });
    if (totalpage <= 9) {
      for (let i = 0; i < totalpage; i++) {
        this.buildLi(origin, i, current);
      }
      return;
    }
    // Five on the left... Two on the right
    if (this.bindLeftList(current, totalpage, origin)) {
      return;
    }
    // The current page is larger than 5 pages and smaller than the last 5 pages
    for (let index = 0; index < 2; index++) {
      this.buildLi(origin, index, current);
    }
    let span = document.createElement('span');
    span.innerText = '...'; // @ts-ignore
    this.list.appendChild(span);
    for (let i = current - 3; i < current + 2; i++) {
      this.buildLi(origin, i, current);
    }
    span = document.createElement('span');
    span.innerText = '...'; // @ts-ignore
    this.list.appendChild(span);
    for (let i = totalpage - 2; i < totalpage; i++) {
      this.buildLi(origin, i, current);
    }
  }

  private buildLi(origin: HTMLElement, i: number, current: number): void {
    const li = origin.cloneNode(true);
    // @ts-ignore
    li.innerText = i + 1;
    if (i + 1 === current) {
      this.setElementStyles(li, {
        backgroundColor: PageNation.BtnBackColor,
        color: PageNation.BtnColor,
      });
    } // @ts-ignore
    this.list.appendChild(li);
  }

  bindLeftList(current: number, totalpage: number, origin: HTMLElement): boolean {
    let span;
    if (current < 5) {
      // 左边5个 中间 ... 右边2个
      for (let index = 0; index < 5; index++) {
        this.buildLi(origin, index, current);
      }
      span = document.createElement('span');
      span.innerText = '...'; // @ts-ignore
      this.list.appendChild(span);
      for (let index = totalpage - 2; index < totalpage; index++) {
        this.buildLi(origin, index, current);
      }
      return true;
    }
    if (current === 5) {
      // 左边5个 中间 ... 右边2个
      for (let i = 0; i < 7; i++) {
        this.buildLi(origin, i, current);
      }
      span = document.createElement('span');
      span.innerText = '...'; // @ts-ignore
      this.list.appendChild(span);

      for (let index = totalpage - 2; index < totalpage; index++) {
        this.buildLi(origin, index, current);
      }
      return true;
    }
    // 当前页面 大于倒数第5页
    if (current > totalpage - 4) {
      // 左边5个 中间 ... 右边2个
      for (let index = 0; index < 2; index++) {
        this.buildLi(origin, index, current);
      }
      span = document.createElement('span');
      span.innerText = '...'; // @ts-ignore
      this.list.appendChild(span);
      for (let i = totalpage - 5; i < totalpage; i++) {
        this.buildLi(origin, i, current);
      }
      return true;
    }
    if (current === totalpage - 4) {
      // 左边5个 中间 ... 右边2个
      this.nodeAppendChild(origin, current, span, totalpage);
      return true;
    }
    return false;
  }

  nodeAppendChild(origin: HTMLElement, current: number, span: unknown, totalpage: number): void {
    for (let i = 0; i < 2; i++) {
      this.buildLi(origin, i, current);
    }
    span = document.createElement('span'); // @ts-ignore
    span.innerText = '...'; // @ts-ignore
    this.list.appendChild(span);
    for (let i = totalpage - 7; i < totalpage; i++) {
      this.buildLi(origin, i, current);
    }
  }

  bindPageEvent(): void {
    // @ts-ignore
    this.element.addEventListener(
      'click',
      (event: {
        target: {
          name: string;
          dataset: { name: string };
          innerText: number;
        };
      }) => {
        this.targetName(event);
        if (event.target.name === 'goto') {
          // 拿到你文本的内容
          // @ts-ignore
          let page = this.inputBox.value - 0;
          if (isNaN(page)) {
            page = 1;
          }
          if (page <= 1) {
            page = 1;
          } // @ts-ignore
          if (page >= this.pageInfo.totalpage) {
            // @ts-ignore
            page = this.pageInfo.totalpage;
          } // @ts-ignore
          this.pageInfo.current = page;
          this.bindPageHtml();
        }
        if (event.target.dataset.name === 'item') {
          // @ts-ignore
          this.pageInfo.current = event.target.innerText - 0;
          this.bindPageHtml();
        }
      }
    );
  }

  targetName(event: {
    target: {
      name: string;
      dataset: { name: string };
      innerText: number;
    };
  }): void {
    if (event.target.name === 'first') {
      // @ts-ignore
      if (this.pageInfo.current === 1) {
        return;
      } // @ts-ignore
      this.pageInfo.current = 1;
      this.bindPageHtml();
    }
    if (event.target.name === 'prev') {
      // @ts-ignore
      if (this.pageInfo.current === 1) {
        return;
      } // @ts-ignore
      this.pageInfo.current--;
      this.bindPageHtml();
    }
    if (event.target.name === 'next') {
      // @ts-ignore
      if (this.pageInfo.current === this.pageInfo.totalpage) {
        return;
      } // @ts-ignore
      this.pageInfo.current++;
      this.bindPageHtml();
    }
    if (event.target.name === 'last') {
      // @ts-ignore
      if (this.pageInfo.current === this.pageInfo.totalpage) {
        return;
      } // @ts-ignore
      this.pageInfo.current = this.pageInfo.totalpage;
      this.bindPageHtml();
    }
  }
}
