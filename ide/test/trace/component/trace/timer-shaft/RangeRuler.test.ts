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

import { RangeRuler } from '../../../../../src/trace/component/trace/timer-shaft/RangeRuler';
import { Mark } from '../../../../../src/trace/component/trace/timer-shaft/RangeRuler';
import { TimerShaftElement } from '../../../../../src/trace/component/trace/TimerShaftElement';
import { SpSystemTrace } from '../../../../../src/trace/component/SpSystemTrace';

jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('RangeRuler Test', () => {
  global.Worker = jest.fn();
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  document.body.innerHTML = '<sp-system-trace style="visibility:visible;" id="sp-system-trace">' +
    '<timer-shaft-element id="timerShaftEL"><timer-shaft-element>';

  let timerShaftElement = document.querySelector('#timerShaftEL') as TimerShaftElement;

  let rangeRuler = new RangeRuler(
    timerShaftElement,
    {
      x: 20,
      y: 20,
      width: 100,
      height: 100,
    },
    {
      startX: 10,
      endX: 30,
    },
    () => {}
  );
  let mark = new Mark(canvas, 'name',ctx, {
    x: 20,
    y: 20,
    width: 100,
    height: 100,
  });

  rangeRuler.cpuUsage = [
    {
      cpu: 1,
      ro: 2,
      rate: 2,
    },
  ];

  mark.isHover = true;
  let currentSlicesTime = {
    startTime: 1,
    endTime: 200
  }
  it('RangeRulerTest01', function () {
    expect(rangeRuler.drawCpuUsage()).toBeUndefined();
  });

  it('RangeRulerTest02', function () {
    expect(rangeRuler.fillX()).toBeUndefined();
  });

  it('RangeRulerTest21', function () {
    rangeRuler.range.startNS = -1;
    expect(rangeRuler.fillX()).toBe(undefined);
  });

  it('RangeRulerTest22', function () {
    rangeRuler.range.endNS = -1;
    expect(rangeRuler.fillX()).toBe(undefined);
  });

  it('RangeRulerTest23', function () {
    rangeRuler.range.endNS = -1;
    rangeRuler.range.totalNS = -2;
    expect(rangeRuler.fillX()).toBe(undefined);
  });

  it('RangeRulerTest24', function () {
    rangeRuler.range.startNS = -1;
    rangeRuler.range.totalNS = -2;
    expect(rangeRuler.fillX()).toBe(undefined);
  });

  it('RangeRulerTest03', function () {
    expect(
      rangeRuler.keyPress({
        key: 'w',
      }, currentSlicesTime)
    ).toBeUndefined();
  });

  it('RangeRulerTest04', function () {
    expect(
      rangeRuler.keyPress({
        key: 's',
      }, currentSlicesTime)
    ).toBeUndefined();
  });

  it('RangeRulerTest05', function () {
    expect(
      rangeRuler.keyPress({
        key: 'a',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest06', function () {
    expect(
      rangeRuler.keyPress({
        key: 'd',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest07', function () {
    expect(
      rangeRuler.keyUp({
        key: 'w',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest08', function () {
    expect(
      rangeRuler.keyUp({
        key: 's',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest09', function () {
    expect(
      rangeRuler.keyUp({
        key: 'a',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest10', function () {
    expect(
      rangeRuler.keyUp({
        key: 'd',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest11', function () {
    expect(
      rangeRuler.mouseUp({
        key: '',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest12', function () {
    expect(
      rangeRuler.mouseOut({
        key: '',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest13', function () {
    rangeRuler.rangeRect = jest.fn(() => true);
    rangeRuler.rangeRect.containsWithPadding = jest.fn(() => true);
    expect(
      rangeRuler.mouseDown({
        key: '',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest14', function () {
    rangeRuler.rangeRect = jest.fn(() => true);
    rangeRuler.rangeRect.containsWithPadding = jest.fn(() => false);
    rangeRuler.frame = jest.fn(() => false);
    rangeRuler.frame.containsWithMargin = jest.fn(() => true);
    rangeRuler.rangeRect.containsWithMargin = jest.fn(() => false);
    expect(
      rangeRuler.mouseDown({
        key: '',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest15', function () {
    let htmlElement: any = document.createElement('sp-system-trace');
    rangeRuler.centerXPercentage = jest.fn(() => -1);
    expect(
      rangeRuler.mouseMove({
        key: '',
      }, htmlElement)
    ).toBeUndefined();
  });

  it('RangeRulerTest16', () => {
    rangeRuler.movingMark = jest.fn(() => false);
    rangeRuler.movingMark.frame = jest.fn(() => false);
    rangeRuler.movingMark.frame.x = jest.fn(() => false);
    rangeRuler.rangeRect = jest.fn(() => true);
    rangeRuler.rangeRect.containsWithPadding = jest.fn(() => true);
    rangeRuler.movingMark.inspectionFrame = jest.fn(() => false);
    rangeRuler.movingMark.inspectionFrame.x = jest.fn(() => false);
    expect(
      rangeRuler.mouseMove({
        key: '',
      })
    ).toBeUndefined();
  });

  it('RangeRulerTest17', () => {
    rangeRuler.notifyHandler = jest.fn(() => true);
    rangeRuler.movingMark.inspectionFrame.x = jest.fn(() => false);
    rangeRuler.frame = jest.fn(() => true);
    rangeRuler.frame.x = jest.fn(() => true);
    rangeRuler.frame.y = jest.fn(() => true);
    expect(rangeRuler.draw()).toBeUndefined();
  });

  it('RangeRulerTest18', function () {
    expect(mark.isHover).toBeTruthy();
  });
  it('RangeRulerTest19', function () {
    expect(rangeRuler.draw()).toBeUndefined();
  });

  it('RangeRulerTest20', function () {
    rangeRuler.setRangeNS(0, 2000);
    expect(rangeRuler.getRange().scale).toBe(50);
  });

  it('RangeRulerTest25', function () {
    expect(rangeRuler.delayDraw()).toBeUndefined();
  });
  it('RangeRulerTest26', function () {
    let frameCallback: any;
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyPressF();
    if (frameCallback) {
      frameCallback();
    }
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyPressW();
    if (frameCallback) {
      frameCallback();
    }
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyPressS();
    if (frameCallback) {
      frameCallback();
    }
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyPressA();
    if (frameCallback) {
      frameCallback();
    }
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyPressD();
    if (frameCallback) {
      frameCallback();
    }
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyUpW();
    if (frameCallback) {
      frameCallback();
    }
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyUpS();
    if (frameCallback) {
      frameCallback();
    }
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyUpA();
    if (frameCallback) {
      frameCallback();
    }
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyUpEnd();
    if (frameCallback) {
      frameCallback();
    }
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.keyUpD();
    if (frameCallback) {
      frameCallback();
    }
    expect(rangeRuler.getScale()).toBe(50)
  });
  it('RangeRulerTest27', function () {
    expect(mark.draw()).toBeUndefined();
  });
  it('RangeRulerTest28', function () {
    expect(rangeRuler.drawSelectionRange()).toBeUndefined();
  });
  it('RangeRulerTest29', function () {
    expect(rangeRuler.translate(100)).toBeUndefined();
  });

  it('RangeRulerTest30', function () {
    rangeRuler.isMovingRange = false;
    rangeRuler.handleMovingFresh(10, 20);

    let frameCallback: any;
    global.requestAnimationFrame = (callback) => {
      frameCallback = callback;
      return 0;
    };
    rangeRuler.scale = 100;
    rangeRuler.keyPressW();
    if (frameCallback) {
      frameCallback();
    }
    expect(rangeRuler.getScale()).toBe(100);
  });
});
