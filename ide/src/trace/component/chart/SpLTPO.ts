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
import { CpuFreqStruct } from '../../database/ui-worker/ProcedureWorkerFreq';
import {
  queryFanceNameList,
  queryFpsNameList,
  queryRealFpsList
} from '../../database/sql/Ltpo.sql';
import { LtpoRender, LtpoStruct } from '../../database/ui-worker/ProcedureWorkerLTPO'
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
  static ltpoDataArr: Array<LtpoStruct> = [];
  static sendLTPODataArr: Array<LtpoStruct> = [];
  static sendHitchDataArr: Array<LtpoStruct> = [];
  static threadName : String = 'Present%';
  static funName: String = 'H:Waiting for Present Fence%';
  constructor(trace: SpSystemTrace) {
    SpLtpoChart.trace = trace;
  }

  async init() {
    SpLtpoChart.ltpoDataArr = [];
    SpLtpoChart.fanceNameList = await queryFanceNameList();
    SpLtpoChart.fpsnameList = await queryFpsNameList();
    SpLtpoChart.realFpsList = await queryRealFpsList();
    SpLtpoChart.fanceNameList.map((item) => {
      let cutFanceNameArr = item.name!.split(" ");
      item.fanceId = Number(cutFanceNameArr[cutFanceNameArr.length - 1]);
    });
    SpLtpoChart.fpsnameList.map((item) => {
      let cutFpsNameArr = item.name!.split(",")[0].split(":");
      item.fps = Number(cutFpsNameArr[cutFpsNameArr.length - 1]);
    });
    if (SpLtpoChart.realFpsList.length > 0) {
      SpLtpoChart.realFpsList.map((item) => {
        let cutRealFpsArr = item.name!.split(' ');
        item.fps = Number(cutRealFpsArr[cutRealFpsArr.length - 1]);
      });
      this.setRealFps();
    };
    //特殊情况：当前trace的RSHardwareThrea泳道最前面多一个单独的fence
    if(SpLtpoChart.fpsnameList.length > 0 && SpLtpoChart.fanceNameList.length - SpLtpoChart.fpsnameList.length === 1){
      if(Number(SpLtpoChart.fanceNameList[0].ts) < Number(SpLtpoChart.fpsnameList[0].ts)){
        SpLtpoChart.fanceNameList.splice(0,1);
      }
    }
    if (SpLtpoChart.fanceNameList!.length && SpLtpoChart.fpsnameList.length === SpLtpoChart.fanceNameList.length) {
      for (let i = 0; i < SpLtpoChart.fanceNameList.length; i++) {
        let tmpFps = SpLtpoChart.fpsnameList[i]!.fps ? Number(SpLtpoChart.fpsnameList[i]!.fps) : 60;
        this.pushLtpoData(
          SpLtpoChart.ltpoDataArr,
          Number(SpLtpoChart.fanceNameList[i]!.fanceId!),
          tmpFps,
          0, 0, 0, 0
        );
      }
    } else {
      return;
    }
    if (SpLtpoChart.fanceNameList && SpLtpoChart.fanceNameList.length) {
      await this.initFolder();
      await this.initHitchTime();
    }
  }
  //处理fps
  setRealFps(): void {
    let moreIndex = 0;
    let reallIndex = 0;
    while (moreIndex < SpLtpoChart.fpsnameList.length) {
      let itemMoreEndTs = Number(SpLtpoChart.fpsnameList[moreIndex].ts) + Number(SpLtpoChart.fpsnameList[moreIndex].dur);
      if (Number(SpLtpoChart.realFpsList[reallIndex].ts) < itemMoreEndTs) {//此时这一帧包含了两个fps，将真实的fps赋给SpLtpoChart.fpsnameList
        SpLtpoChart.fpsnameList[moreIndex].fps = SpLtpoChart.realFpsList[reallIndex].fps;
        moreIndex++;
        if(reallIndex < SpLtpoChart.realFpsList.length - 1){//判断SpLtpoChart.realFpsList有没有遍历完，没有就继续
          reallIndex++;
        }else{//否则跳出
          return;
        }
      } else {//如果不满足的话，SpLtpoChart.fpsnameList数组往下走，而reallIndex不变
        moreIndex++;
      }
    }
  }
  pushLtpoData(
    lptoArr: any[] | undefined,
    fanceId: Number,
    fps: Number,
    startTs: Number,
    dur: Number,
    nextStartTs: Number,
    nextDur: number
  ): void {
    lptoArr?.push(
      {
        fanceId: fanceId,
        fps: fps,
        startTs: startTs,
        dur: dur,
        nextStartTs: nextStartTs,
        nextDur: nextDur
      }
    );
  }
  sendDataHandle(presentArr: LtpoStruct[], ltpoDataArr: LtpoStruct[]): Array<LtpoStruct> {
    let sendDataArr: LtpoStruct[] = [];
    //当有present缺失时：
    let presentIndex = 0;
    let fpsIndex = 0;
    while(presentIndex < presentArr.length) {//遍历present，把ltpoDataArr中不包含present中presentFance的item舍弃掉
      if(Number(presentArr[presentIndex].presentId) < Number(ltpoDataArr[fpsIndex].fanceId)){
        presentArr.splice(presentIndex,1);
      }else if(Number(presentArr[presentIndex].presentId) > Number(ltpoDataArr[fpsIndex].fanceId)) {
        ltpoDataArr.splice(fpsIndex,1);
      }else{
        if(presentIndex === presentArr.length-1 && fpsIndex < ltpoDataArr.length-1){//此时present已经遍历到最后一项，如果ltpoDataArr还没有遍历到最后一项，就把后面的舍弃掉
          ltpoDataArr.splice(fpsIndex);
        }
        presentIndex++;
        fpsIndex++;
      }
    };
    if (presentArr!.length && presentArr!.length === ltpoDataArr!.length) {
      for (let i = 0; i < presentArr!.length; i++) {
        ltpoDataArr[i].startTs = Number(presentArr[i].startTime) - (window as any).recordStartNS;
        ltpoDataArr[i].dur = presentArr[i].dur;
        ltpoDataArr[i].nextStartTs = presentArr[i + 1] ? Number(presentArr[i + 1].startTime) - (window as any).recordStartNS : '';
        ltpoDataArr[i].nextDur = presentArr[i + 1] ? presentArr[i + 1].dur : 0;
      }
    } else {
      return sendDataArr;
    }
    for (let i = 0; i < ltpoDataArr.length; i++) {
      if (ltpoDataArr[i].fanceId !== -1 && ltpoDataArr[i].nextDur) {
        let sendStartTs: number | undefined = 0;
        let sendDur: number | undefined = 0;
        sendStartTs = Number(ltpoDataArr[i].startTs) + Number(ltpoDataArr[i].dur);
        sendDur = Number(ltpoDataArr[i].nextStartTs) + Number(ltpoDataArr[i].nextDur) - sendStartTs;
        let tmpDur = (Math.ceil(sendDur / 100000)) / 10;
        if (tmpDur < 170) {
          sendDataArr.push(
            {
              dur: sendDur,
              value: 0,
              startTs: sendStartTs,
              pid: ltpoDataArr[i].fanceId,
              itid: ltpoDataArr[i].fanceId,
              name: undefined,
              presentId: ltpoDataArr[i].fanceId,
              ts: undefined,
              fanceId: ltpoDataArr[i].fanceId,
              fps: ltpoDataArr[i].fps,
              nextStartTs: ltpoDataArr[i].nextStartTs,
              nextDur: ltpoDataArr[i].nextDur,
              translateY: undefined,
              frame: undefined,
              isHover: false,
              startTime: undefined
            }
          );
        }
      }
    }
    return sendDataArr;
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
        SpLtpoChart.presentArr = res
        SpLtpoChart.sendLTPODataArr = this.sendDataHandle(SpLtpoChart.presentArr, SpLtpoChart.ltpoDataArr);
        for (let i = 0; i < SpLtpoChart.sendLTPODataArr.length; i++) {
          let tmpDur = SpLtpoChart.sendLTPODataArr[i].dur! / 1000000;
          SpLtpoChart.sendLTPODataArr[i].value = (Math.round(tmpDur * Number(SpLtpoChart.sendLTPODataArr[i].fps) / 1000 - 1)) < 1 ? 0 : Math.round(tmpDur * Number(SpLtpoChart.sendLTPODataArr[i].fps) / 1000 - 1);
        }
        return SpLtpoChart.sendLTPODataArr;

      })
    }
    row.focusHandler = (ev) => {
      SpLtpoChart.trace?.displayTip(
        row!,
        LtpoStruct.hoverLtpoStruct,
        `<span>${(LtpoStruct.hoverLtpoStruct?.value!)}</span>`
      )
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
          appStartupContext: context,
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
    row.rowId = SpLtpoChart.fanceNameList!.length ? `hitch-time ${SpLtpoChart.fanceNameList[0].fanceId}` : '';
    row.rowParentId = '';
    row.rowType = TraceRow.ROW_TYPE_HITCH_TIME;
    row.folder = false;
    row.style.height = '40px';
    row.name = `Hitch Time`;
    row.favoriteChangeHandler = SpLtpoChart.trace.favoriteChangeHandler;
    row.selectChangeHandler = SpLtpoChart.trace.selectChangeHandler;
    row.supplierFrame = () => {
      return lostFrameSender(SpLtpoChart.threadName, SpLtpoChart.funName, row).then((res) => {
        SpLtpoChart.presentArr = res
        SpLtpoChart.sendHitchDataArr = this.sendDataHandle(SpLtpoChart.presentArr, SpLtpoChart.ltpoDataArr);
        for (let i = 0; i < SpLtpoChart.sendHitchDataArr.length; i++) {
          let tmpVale = Number((Math.ceil(((SpLtpoChart.sendHitchDataArr[i].dur! / 1000000) - (1000 / SpLtpoChart.sendHitchDataArr[i].fps!)) * 10)) / 10);
          let tmpDur = SpLtpoChart.sendLTPODataArr[i].dur! / 1000000;
          SpLtpoChart.sendHitchDataArr[i].value = tmpVale! < 0 ? 0 : tmpVale;
          SpLtpoChart.sendHitchDataArr[i].name = String((Math.round(tmpDur *
            Number(SpLtpoChart.sendLTPODataArr[i].fps) / 1000 - 1)) < 1 ? 0 :
            Math.round(tmpDur * Number(SpLtpoChart.sendLTPODataArr[i].fps) / 1000 - 1));
        }
        return SpLtpoChart.sendHitchDataArr;
      })
    }
    row.focusHandler = (ev) => {
      SpLtpoChart.trace?.displayTip(
        row!,
        HitchTimeStruct.hoverHitchTimeStruct,
        `<span>${(HitchTimeStruct.hoverHitchTimeStruct?.value!)}</span>`
      )
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
          appStartupContext: context,
          useCache: useCache,
          type: `hitch ${row.rowId}`,
        },
        row
      );
      row.canvasRestore(context);
    };
    SpLtpoChart.trace.rowsEL?.appendChild(row);
  }
}
