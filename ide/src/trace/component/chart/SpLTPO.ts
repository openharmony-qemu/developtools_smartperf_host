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
 * limitations under the License.??
 */

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { FlagsConfig } from '../SpFlags';
import { CpuFreqStruct } from '../../database/ui-worker/ProcedureWorkerFreq';
import {
  queryFanceNameList,
  queryFpsNameList,
  queryRealFpsList,
  queryRSNowTimeList,
  querySignaledList,
  querySkipDataList,
} from '../../database/sql/Ltpo.sql';
import { LtpoRender, LtpoStruct } from '../../database/ui-worker/ProcedureWorkerLTPO';
import { HitchTimeStruct, hitchTimeRender } from '../../database/ui-worker/ProcedureWorkerHitchTime';
import { lostFrameSender } from '../../database/data-trafic/LostFrameSender';

export class SpLtpoChart {
  private readonly trace: SpSystemTrace | undefined;
  static APP_STARTUP_PID_ARR: Array<number> = [];
  static jsonRow: TraceRow<CpuFreqStruct> | undefined;
  static trace: SpSystemTrace;
  static presentArr: Array<LtpoStruct> = [];
  static fanceNameList: Array<LtpoStruct> = [];
  static fpsnameList: Array<LtpoStruct> = [];
  static realFpsList: Array<LtpoStruct> = [];
  static rsNowTimeList: Array<LtpoStruct> = [];
  static skipDataList: Array<LtpoStruct> = [];
  static ltpoDataArr: Array<LtpoStruct> = [];
  static sendLTPODataArr: Array<LtpoStruct> = [];
  static sendHitchDataArr: Array<LtpoStruct> = [];
  static signaledFence: Array<LtpoStruct> = [];
  static tempRsNowTimeList: Array<LtpoStruct> = [];
  static threadName: String = 'Present%';
  static funName: String = 'H:Waiting for Present Fence%';
  static signaledList: Array<LtpoStruct> = [];
  constructor(trace: SpSystemTrace) {
    SpLtpoChart.trace = trace;
  }

  async init() {
    let loadLtpo: boolean = FlagsConfig.getFlagsConfigEnableStatus('LTPO');
    if (!loadLtpo) {
      return;
    }
    SpLtpoChart.ltpoDataArr = [];
    SpLtpoChart.fanceNameList = await queryFanceNameList();
    SpLtpoChart.fpsnameList = await queryFpsNameList();
    SpLtpoChart.realFpsList = await queryRealFpsList();
    SpLtpoChart.rsNowTimeList = await queryRSNowTimeList();
    SpLtpoChart.skipDataList = await querySkipDataList();
    SpLtpoChart.signaledList = await querySignaledList();
    this.initFenceName();
    this.initFpsName();
    if (SpLtpoChart.realFpsList.length > 0) {
      this.initRealFps();
    }
    this.initRsNowTime();
    //特殊情况：当前trace的RSHardwareThrea泳道最前面多一个单独的fence
    if (SpLtpoChart.fpsnameList.length > 0 && SpLtpoChart.fanceNameList.length - SpLtpoChart.fpsnameList.length === 1) {
      if (Number(SpLtpoChart.fanceNameList[0].ts) < Number(SpLtpoChart.fpsnameList[0].ts)) {
        SpLtpoChart.fanceNameList.splice(0, 1);
      }
    }
    if (SpLtpoChart.fanceNameList!.length && SpLtpoChart.fpsnameList.length !== SpLtpoChart.fanceNameList.length) {
      let fpsIndex = 0;
      let fanceIndex = 0;
      while (fpsIndex < SpLtpoChart.fpsnameList!.length) {
        if (SpLtpoChart.fanceNameList[fanceIndex] && SpLtpoChart.fpsnameList[fpsIndex]) {
          if (
            SpLtpoChart.fanceNameList[fanceIndex].ts! > SpLtpoChart.fpsnameList[fpsIndex].ts! &&
            SpLtpoChart.fanceNameList[fanceIndex].ts! <
            SpLtpoChart.fpsnameList[fpsIndex].ts! + SpLtpoChart.fpsnameList[fpsIndex].dur!
          ) {
            fpsIndex++;
            fanceIndex++;
          } else if (SpLtpoChart.fanceNameList[fanceIndex].ts! < SpLtpoChart.fpsnameList[fpsIndex].ts!) {
            SpLtpoChart.fanceNameList.splice(fanceIndex, 1);
          } else if (
            SpLtpoChart.fanceNameList[fanceIndex].ts! >
            SpLtpoChart.fpsnameList[fpsIndex].ts! + SpLtpoChart.fpsnameList[fpsIndex].dur!
          ) {
            SpLtpoChart.fpsnameList.splice(fpsIndex, 1);
          }
        } else if (SpLtpoChart.fanceNameList[fanceIndex] && !SpLtpoChart.fpsnameList[fpsIndex]) {
          SpLtpoChart.fanceNameList.splice(fanceIndex);
        } else if (!SpLtpoChart.fanceNameList[fanceIndex] && SpLtpoChart.fpsnameList[fpsIndex]) {
          SpLtpoChart.fpsnameList.splice(fpsIndex);
        } else {
          return;
        }
      }
    }
    if (SpLtpoChart.fanceNameList!.length && SpLtpoChart.fpsnameList.length === SpLtpoChart.fanceNameList.length) {
      for (let i = 0; i < SpLtpoChart.fanceNameList.length; i++) {
        let tmpFps = SpLtpoChart.fpsnameList[i]!.fps ? Number(SpLtpoChart.fpsnameList[i]!.fps) : 60;
        let signaled = Number(SpLtpoChart.fanceNameList[i]!.signaled);
        let startTime = Number(SpLtpoChart.fanceNameList[i]!.ts);
        let durtaion = Number(SpLtpoChart.fanceNameList[i]!.dur);
        if (SpLtpoChart.fanceNameList[i]!.signaled) {
          this.pushLtpoData(
            SpLtpoChart.ltpoDataArr,
            SpLtpoChart.fanceNameList[i]!.fanceId!,
            tmpFps,
            signaled,
            startTime,
            durtaion,
            0,
            0
          );
        } else {
          this.pushLtpoData(SpLtpoChart.ltpoDataArr, SpLtpoChart.fanceNameList[i]!.fanceId!, tmpFps, 0, 0, 0, 0, 0);
        }
      }
    } else {
      return;
    }
    this.fenceToFps();
    this.fpsToRenderService();
    this.filterNowTime();
    if (SpLtpoChart.fanceNameList && SpLtpoChart.fanceNameList.length) {
      await this.initFolder();
      await this.initHitchTime();
    }
  }
  //提取FenceId
  initFenceName(): void {
    SpLtpoChart.fanceNameList.map((item) => {
      let cutFanceNameArr = item.name!.split(' ');
      if (cutFanceNameArr[cutFanceNameArr.length - 1].includes('signaled')) {
        item.fanceId = Number(cutFanceNameArr[2]);
        item.signaled = 1;
        SpLtpoChart.signaledFence.push(item);
      } else {
        item.fanceId = Number(cutFanceNameArr[cutFanceNameArr.length - 1].split('|')[0]);
      }
    });
  }
  //从数据库中查询的name中提取fps
  initFpsName(): void {
    SpLtpoChart.fpsnameList.map((item) => {
      if (item.name!.indexOf('=') === -1) {
        let cutFpsNameArr = item.name!.split(',')[0].split(':');
        let cutFpsNameTimeArr = item.name!.split(',')[1].split(':');
        item.fps = Number(cutFpsNameArr[cutFpsNameArr.length - 1]);
        item.nowTime = Number(cutFpsNameTimeArr[cutFpsNameTimeArr.length - 1]);
      } else {
        let cutFpsNameArr = item.name!.split('=');
        item.fps = Number(cutFpsNameArr[cutFpsNameArr.length - 1]);
      }
    });
  }
  //如果存在切帧，提取fps
  initRealFps(): void {
    SpLtpoChart.realFpsList.map((item) => {
      let cutRealFpsArr = item.name!.split(' ');
      item.fps = Number(cutRealFpsArr[cutRealFpsArr.length - 1]);
    });
    this.setRealFps();
  }
  //从render_service中获取nowTime
  initRsNowTime(): void {
    SpLtpoChart.rsNowTimeList.map((item) => {
      let cutRsNameArr = item.name!.split('now')[1].split(' ')[1];
      item.nowTime = Number(cutRsNameArr);
    });
  }
  //处理fps
  setRealFps(): void {
    let moreIndex = 0;
    let reallIndex = 0;
    while (moreIndex < SpLtpoChart.fpsnameList.length) {
      let itemMoreEndTs =
        Number(SpLtpoChart.fpsnameList[moreIndex].ts) + Number(SpLtpoChart.fpsnameList[moreIndex].dur);
      if (Number(SpLtpoChart.realFpsList[reallIndex].ts) < itemMoreEndTs) {
        //此时这一帧包含了两个fps，将真实的fps赋给SpLtpoChart.fpsnameList
        SpLtpoChart.fpsnameList[moreIndex].fps = SpLtpoChart.realFpsList[reallIndex].fps;
        moreIndex++;
        if (reallIndex < SpLtpoChart.realFpsList.length - 1) {
          //判断SpLtpoChart.realFpsList有没有遍历完，没有就继续
          reallIndex++;
        } else {
          //否则跳出
          return;
        }
      } else {
        //如果不满足的话，SpLtpoChart.fpsnameList数组往下走，而reallIndex不变
        moreIndex++;
      }
    }
  }
  //RSHardwareThread泳道的fps数组集成FenceId数组中的FenceId和signaled
  fenceToFps() {
    if (SpLtpoChart.fanceNameList.length === SpLtpoChart.fpsnameList.length) {
      let fenceIndex = 0;
      let fpsIndex = 0;
      while (fpsIndex < SpLtpoChart.fpsnameList.length) {
        if (SpLtpoChart.fpsnameList[fpsIndex] && SpLtpoChart.fanceNameList[fenceIndex]) {
          if (
            SpLtpoChart.fanceNameList[fenceIndex].ts! > SpLtpoChart.fpsnameList[fpsIndex].ts! &&
            SpLtpoChart.fanceNameList[fenceIndex].ts! <
            SpLtpoChart.fpsnameList[fpsIndex].ts! + SpLtpoChart.fpsnameList[fpsIndex].dur!
          ) {
            SpLtpoChart.fpsnameList[fpsIndex].fanceId = SpLtpoChart.fanceNameList[fenceIndex].fanceId;
            if (SpLtpoChart.fanceNameList[fenceIndex].signaled) {
              SpLtpoChart.fpsnameList[fpsIndex].signaled = SpLtpoChart.fanceNameList[fenceIndex].signaled;
            }
            fenceIndex++;
            fpsIndex++;
          } else if (SpLtpoChart.fanceNameList[fenceIndex].ts! < SpLtpoChart.fpsnameList[fpsIndex].ts!) {
            fenceIndex++;
          } else if (
            SpLtpoChart.fanceNameList[fenceIndex].ts! >
            SpLtpoChart.fpsnameList[fpsIndex].ts! + SpLtpoChart.fpsnameList[fpsIndex].dur!
          ) {
            fpsIndex++;
          } else {
            return;
          }
        } else {
          return;
        }
      }
    }
  }
  //render_service的nowTime 集成RSHardThread泳道Fps数组的FenceId和Signaled
  fpsToRenderService(): void {
    let rsIndex = 0;
    let hardIndex = 0;
    while (rsIndex < SpLtpoChart.rsNowTimeList.length) {
      if (SpLtpoChart.fpsnameList[hardIndex] && SpLtpoChart.rsNowTimeList[rsIndex]) {
        if (SpLtpoChart.rsNowTimeList[rsIndex].nowTime! > SpLtpoChart.fpsnameList[hardIndex].nowTime!) {
          //处理nowTime不一致的情况
          hardIndex++;
        } else if (SpLtpoChart.rsNowTimeList[rsIndex].nowTime! < SpLtpoChart.fpsnameList[hardIndex].nowTime!) {
          rsIndex++;
        } else {
          SpLtpoChart.rsNowTimeList[rsIndex].fanceId = SpLtpoChart.fpsnameList[hardIndex].fanceId;
          SpLtpoChart.rsNowTimeList[rsIndex].fps = SpLtpoChart.fpsnameList[hardIndex].fps;
          if (SpLtpoChart.fpsnameList[hardIndex].signaled) {
            SpLtpoChart.rsNowTimeList[rsIndex].signaled = SpLtpoChart.fpsnameList[hardIndex].signaled;
          }
          hardIndex++;
          rsIndex++;
        }
      } else {
        return;
      }
    }
  }
  //render_service中找出skip和signaled，将需要从上平时间减去的时间计算出来存在对应的nowTime的item中
  filterNowTime(): void {
    let skipIndex = 0;
    let nowTimeIndex = 0;
    let cutTimeSum = 0;
    let tempFps = 0; //如果中间出现signaled，记录一下fps；
    //将render_service中的nowTime数组中的skip去除掉
    SpLtpoChart.tempRsNowTimeList = SpLtpoChart.rsNowTimeList.filter((item) => item.fps);
    while (skipIndex < SpLtpoChart.skipDataList.length) {
      if (SpLtpoChart.skipDataList[skipIndex] && SpLtpoChart.tempRsNowTimeList[nowTimeIndex]) {
        if (SpLtpoChart.skipDataList[skipIndex].ts! > SpLtpoChart.tempRsNowTimeList[nowTimeIndex].ts!) {
          if (cutTimeSum > 0 && nowTimeIndex > 0) {
            SpLtpoChart.tempRsNowTimeList[nowTimeIndex - 1].cutTime = cutTimeSum;
            if (!SpLtpoChart.tempRsNowTimeList[nowTimeIndex].signaled) {
              cutTimeSum = 0;
            }
          }
          if (SpLtpoChart.tempRsNowTimeList[nowTimeIndex].signaled && nowTimeIndex > 0) {
            //两帧之间初心signaled
            tempFps = SpLtpoChart.tempRsNowTimeList[nowTimeIndex].fps!;
            cutTimeSum += 1000 / tempFps;
            SpLtpoChart.tempRsNowTimeList[nowTimeIndex - 1].cutTime = cutTimeSum;
            SpLtpoChart.tempRsNowTimeList.splice(nowTimeIndex, 1);
          } else {
            nowTimeIndex++;
            cutTimeSum = 0;
            tempFps = 0;
          }
        } else if (SpLtpoChart.skipDataList[skipIndex].ts! <= SpLtpoChart.tempRsNowTimeList[nowTimeIndex].ts!) {
          if (nowTimeIndex > 0) {
            cutTimeSum += tempFps ? 1000 / tempFps : 1000 / SpLtpoChart.tempRsNowTimeList[nowTimeIndex - 1].fps!;
          }
          skipIndex++;
        } else {
          return;
        }
      } else {
        return;
      }
    }
  }
  pushLtpoData(
    lptoArr: unknown[] | undefined,
    fanceId: Number,
    fps: Number,
    signaled: Number,
    startTs: Number,
    dur: Number,
    nextStartTs: Number,
    nextDur: number
  ): void {
    lptoArr?.push({
      fanceId: fanceId,
      fps: fps,
      signaled: signaled,
      startTs: startTs,
      dur: dur,
      nextStartTs: nextStartTs,
      nextDur: nextDur,
    });
  }
  sendDataHandle(presentArr: LtpoStruct[], ltpoDataArr: LtpoStruct[]): Array<LtpoStruct> {
    let sendDataArr: LtpoStruct[] = [];
    let ltpoDataIndex = 0;
    let tempRsNowTimeIndex = 0;
    let presentIndex = 0;
    let ltpoIndex = 0;
    //当有present缺失时：
    this.deleteUselessFence(presentArr, ltpoDataArr);
    while (presentIndex < presentArr.length) {
      if (presentArr[presentIndex] && ltpoDataArr[ltpoIndex]) {
        if (
          // @ts-ignore
          presentArr[presentIndex].startTime! + presentArr[presentIndex].dur! - (window as unknown).recordStartNS ===
          TraceRow.range!.totalNS
        ) {
          presentArr.splice(presentIndex, 1);
        }
        if (presentArr[presentIndex].presentId === ltpoDataArr[ltpoIndex].fanceId) {
          // @ts-ignore
          ltpoDataArr[ltpoIndex].startTs = Number(presentArr[presentIndex].startTime) - (window as unknown).recordStartNS;
          ltpoDataArr[ltpoIndex].dur = presentArr[presentIndex].dur;
          ltpoDataArr[ltpoIndex].nextStartTs = presentArr[presentIndex + 1]
            // @ts-ignore
            ? Number(presentArr[presentIndex + 1].startTime) - (window as unknown).recordStartNS
            : '';
          ltpoDataArr[ltpoIndex].nextDur = presentArr[presentIndex + 1] ? presentArr[presentIndex + 1].dur : 0;
          presentIndex++;
          ltpoIndex++;
        } else if (presentArr[presentIndex].presentId! < ltpoDataArr[ltpoIndex].fanceId!) {
          presentArr.splice(presentIndex, 1);
        } else if (presentArr[presentIndex].presentId! > ltpoDataArr[ltpoIndex].fanceId!) {
          ltpoDataArr.splice(ltpoIndex, 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    while (ltpoDataIndex < ltpoDataArr.length) {
      let sendStartTs: number | undefined = 0;
      let sendDur: number | undefined = 0;
      let cutSendDur: number | undefined = 0;
      if (ltpoDataArr[ltpoDataIndex] && SpLtpoChart.tempRsNowTimeList[tempRsNowTimeIndex]) {
        if (ltpoDataArr[ltpoDataIndex].fanceId! < SpLtpoChart.tempRsNowTimeList[tempRsNowTimeIndex].fanceId!) {
          if (ltpoDataArr[ltpoDataIndex].fanceId !== -1 && ltpoDataArr[ltpoDataIndex].nextDur) {
            sendStartTs = Number(ltpoDataArr[ltpoDataIndex].startTs) + Number(ltpoDataArr[ltpoDataIndex].dur);
            sendDur =
              Number(ltpoDataArr[ltpoDataIndex].nextStartTs) + Number(ltpoDataArr[ltpoDataIndex].nextDur) - sendStartTs;
          }
          let tmpDur = cutSendDur ? Math.ceil(cutSendDur / 100000) / 10 : Math.ceil(sendDur / 100000) / 10;
          if (tmpDur < 170) {
            sendDataArr.push({
              dur: sendDur,
              cutSendDur: cutSendDur,
              value: 0,
              startTs: sendStartTs,
              pid: ltpoDataArr[ltpoDataIndex].fanceId,
              itid: ltpoDataArr[ltpoDataIndex].fanceId,
              name: undefined,
              presentId: ltpoDataArr[ltpoDataIndex].fanceId,
              ts: undefined,
              fanceId: ltpoDataArr[ltpoDataIndex].fanceId,
              fps: ltpoDataArr[ltpoDataIndex].fps,
              nextStartTs: ltpoDataArr[ltpoDataIndex].nextStartTs,
              nextDur: ltpoDataArr[ltpoDataIndex].nextDur,
              translateY: undefined,
              isHover: false,
              startTime: undefined,
              signaled: undefined,
              nowTime: undefined,
              cutTime: undefined,
              frame: undefined,
            });
          }
          ltpoDataIndex++;
        } else if (ltpoDataArr[ltpoDataIndex].fanceId! > SpLtpoChart.tempRsNowTimeList[tempRsNowTimeIndex].fanceId!) {
          tempRsNowTimeIndex++;
        } else {
          if (SpLtpoChart.tempRsNowTimeList[tempRsNowTimeIndex].cutTime) {
            cutSendDur = sendDur - SpLtpoChart.tempRsNowTimeList[tempRsNowTimeIndex].cutTime! * 1000000;
            cutSendDur = cutSendDur < 0 ? 0 : cutSendDur;
          }
          if (ltpoDataArr[ltpoDataIndex].fanceId !== -1 && ltpoDataArr[ltpoDataIndex].nextDur) {
            sendStartTs = Number(ltpoDataArr[ltpoDataIndex].startTs) + Number(ltpoDataArr[ltpoDataIndex].dur);
            sendDur =
              Number(ltpoDataArr[ltpoDataIndex].nextStartTs) + Number(ltpoDataArr[ltpoDataIndex].nextDur) - sendStartTs;
          }
          let tmpDur = cutSendDur ? Math.ceil(cutSendDur / 100000) / 10 : Math.ceil(sendDur / 100000) / 10;
          if (tmpDur < 170) {
            sendDataArr.push({
              dur: sendDur,
              cutSendDur: cutSendDur,
              value: 0,
              startTs: sendStartTs,
              pid: ltpoDataArr[ltpoDataIndex].fanceId,
              itid: ltpoDataArr[ltpoDataIndex].fanceId,
              name: undefined,
              presentId: ltpoDataArr[ltpoDataIndex].fanceId,
              ts: undefined,
              fanceId: ltpoDataArr[ltpoDataIndex].fanceId,
              fps: ltpoDataArr[ltpoDataIndex].fps,
              nextStartTs: ltpoDataArr[ltpoDataIndex].nextStartTs,
              nextDur: ltpoDataArr[ltpoDataIndex].nextDur,
              translateY: undefined,
              isHover: false,
              startTime: undefined,
              signaled: undefined,
              nowTime: undefined,
              cutTime: undefined,
              frame: undefined,
            });
          }
          ltpoDataIndex++;
          tempRsNowTimeIndex++;
        }
      } else {
        break;
      }
    }
    return sendDataArr;
  }
  deleteUselessFence(presentArr: LtpoStruct[], ltpoDataArr: LtpoStruct[]) {
    //当有present缺失时：
    let presentIndex = 0;
    let fpsIndex = 0;
    while (fpsIndex < ltpoDataArr.length) {
      //遍历present，把ltpoDataArr中不包含present中presentFance的item舍弃掉
      if (presentArr[presentIndex] && ltpoDataArr[fpsIndex]) {
        if (Number(presentArr[presentIndex].presentId) < Number(ltpoDataArr[fpsIndex].fanceId)) {
          presentArr.splice(presentIndex, 1);
        } else if (Number(presentArr[presentIndex].presentId) > Number(ltpoDataArr[fpsIndex].fanceId)) {
          ltpoDataArr.splice(fpsIndex, 1);
        } else {
          if (presentIndex === presentArr.length - 1 && fpsIndex < ltpoDataArr.length - 1) {
            //此时present已经遍历到最后一项，如果ltpoDataArr还没有遍历到最后一项，就把后面的舍弃掉
            ltpoDataArr.splice(fpsIndex);
          }
          presentIndex++;
          fpsIndex++;
        }
      } else {
        return;
      }
    }
  }
  //六舍七入
  specialValue(num: number) {
    if (num < 0.7) {
      return 0;
    } else {
      if (!num.toString().split('.')[1]) {
        return num;
      } else {
        let tempNum = Number(num.toString().split('.')[1].charAt(0));
        if (tempNum > 6) {
          return Math.ceil(num);
        } else {
          return Math.floor(num);
        }
      }
    }
  }

  async initFolder() {
    SpLtpoChart.presentArr = [];
    let row: TraceRow<LtpoStruct> = TraceRow.skeleton<LtpoStruct>();
    row.rowId = SpLtpoChart.fanceNameList!.length ? `LTPO ${SpLtpoChart.fanceNameList[0].fanceId}` : '';
    row.rowParentId = '';
    row.rowType = TraceRow.ROW_TYPE_LTPO;
    row.folder = false;
    row.style.height = '40px';
    row.name = `Lost Frames`;
    row.favoriteChangeHandler = SpLtpoChart.trace.favoriteChangeHandler;
    row.selectChangeHandler = SpLtpoChart.trace.selectChangeHandler;
    row.supplierFrame = () => {
      return lostFrameSender(SpLtpoChart.threadName, SpLtpoChart.funName, row).then((res) => {
        SpLtpoChart.presentArr = res;
        SpLtpoChart.sendLTPODataArr = this.sendDataHandle(SpLtpoChart.presentArr, SpLtpoChart.ltpoDataArr);
        for (let i = 0; i < SpLtpoChart.sendLTPODataArr.length; i++) {
          let tmpDur = SpLtpoChart.sendLTPODataArr[i].cutSendDur
            ? SpLtpoChart.sendLTPODataArr[i].cutSendDur! / 1000000
            : SpLtpoChart.sendLTPODataArr[i].dur! / 1000000;
          let mathValue = (tmpDur * Number(SpLtpoChart.sendLTPODataArr[i].fps)) / 1000 - 1;
          SpLtpoChart.sendLTPODataArr[i].value = this.specialValue(mathValue);
        }
        return SpLtpoChart.sendLTPODataArr;
      });
    };
    row.focusHandler = () => {
      SpLtpoChart.trace?.displayTip(
        row!,
        LtpoStruct.hoverLtpoStruct,
        `<span>${LtpoStruct.hoverLtpoStruct?.value!}</span>`
      );
    };
    row.findHoverStruct = (): void => {
      LtpoStruct.hoverLtpoStruct = row.getHoverStruct(true, false, 'value');
    };
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? SpLtpoChart.trace.canvasFavoritePanelCtx! : SpLtpoChart.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders['ltpo-present'] as LtpoRender).renderMainThread(
        {
          ltpoContext: context,
          useCache: useCache,
          type: `ltpo-present ${row.rowId}`,
        },
        row
      );
      row.canvasRestore(context);
    };
    SpLtpoChart.trace.rowsEL?.appendChild(row);
  }
  async initHitchTime() {
    SpLtpoChart.presentArr = [];
    let row: TraceRow<HitchTimeStruct> = TraceRow.skeleton<HitchTimeStruct>();
    this.takeStaticArg(row);
    row.supplierFrame = () => {
      return lostFrameSender(SpLtpoChart.threadName, SpLtpoChart.funName, row).then((res) => {
        SpLtpoChart.presentArr = res;
        SpLtpoChart.sendHitchDataArr = this.sendDataHandle(SpLtpoChart.presentArr, SpLtpoChart.ltpoDataArr);
        for (let i = 0; i < SpLtpoChart.sendHitchDataArr.length; i++) {
          let tmpVale = 0;
          let tmpDur = 0;
          if (SpLtpoChart.sendHitchDataArr[i].cutSendDur) {
            tmpVale =
              SpLtpoChart.sendHitchDataArr[i].cutSendDur! / 1000000 - 1000 / SpLtpoChart.sendHitchDataArr[i].fps!;
            tmpDur = SpLtpoChart.sendHitchDataArr[i].cutSendDur! / 1000000;
          } else {
            tmpVale = SpLtpoChart.sendHitchDataArr[i].dur! / 1000000 - 1000 / SpLtpoChart.sendHitchDataArr[i].fps!;
            tmpDur = SpLtpoChart.sendHitchDataArr[i].dur! / 1000000;
          }

          let mathValue = (tmpDur * Number(SpLtpoChart.sendHitchDataArr[i].fps)) / 1000 - 1;
          let finalValue = (tmpVale! / (1000 / SpLtpoChart.sendHitchDataArr[i].fps!)) < 0.7 ? 0 : tmpVale;
          SpLtpoChart.sendHitchDataArr[i].value = Number(finalValue.toFixed(1));
          SpLtpoChart.sendHitchDataArr[i].name = this.specialValue(mathValue)!.toString();
        }
        return SpLtpoChart.sendHitchDataArr;
      });
    };
    row.focusHandler = () => {
      SpLtpoChart.trace?.displayTip(
        row!,
        HitchTimeStruct.hoverHitchTimeStruct,
        `<span>${HitchTimeStruct.hoverHitchTimeStruct?.value!}</span>`
      );
    };
    row.findHoverStruct = (): void => {
      HitchTimeStruct.hoverHitchTimeStruct = row.getHoverStruct(true, false, 'value');
    };
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? SpLtpoChart.trace.canvasFavoritePanelCtx! : SpLtpoChart.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders['hitch'] as hitchTimeRender).renderMainThread(
        {
          hitchTimeContext: context,
          useCache: useCache,
          type: `hitch ${row.rowId}`,
        },
        row
      );
      row.canvasRestore(context);
    };
    SpLtpoChart.trace.rowsEL?.appendChild(row);
  }
  takeStaticArg(row: TraceRow<HitchTimeStruct>) {
    row.rowId = SpLtpoChart.fanceNameList!.length ? `hitch-time ${SpLtpoChart.fanceNameList[0].fanceId}` : '';
    row.rowParentId = '';
    row.rowType = TraceRow.ROW_TYPE_HITCH_TIME;
    row.folder = false;
    row.style.height = '40px';
    row.name = `Hitch Time`;
    row.favoriteChangeHandler = SpLtpoChart.trace.favoriteChangeHandler;
    row.selectChangeHandler = SpLtpoChart.trace.selectChangeHandler;
  }
}
