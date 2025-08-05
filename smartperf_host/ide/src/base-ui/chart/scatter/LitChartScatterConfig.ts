/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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
export interface LitChartScatterConfig {
  // y轴坐标数组
  yAxisLabel: Array<number>;
  // x轴坐标数组
  xAxisLabel: Array<number>;
  // 坐标轴名称
  axisLabel: Array<string>;
  // 用于判断是否绘制负载线及均衡线
  drawload: boolean;
  // 用于存放最大负载线及均衡线的参数值
  load: Array<number>;
  // 打点数据
  data: Array<Array<Array<number>>>;
  // 用于存放绘图数据
  paintingData: Array<Object>;
  // 用于存放移入点数据
  hoverData: Object | null;
  // 渐变色信息
  globalGradient: CanvasGradient | undefined;
  // 颜色池
  colorPool: () => Array<string>;
  // 移入事件
  hoverEvent: void;
  // 图表名称
  title: string;
  // 颜色数据名称
  colorPoolText: () => Array<string>;
  // 提示信息
  tip: (a: any) => string;
}
