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

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';
import { BaseStruct } from '../../bean/BaseStruct';
import { folderSupplier, rowThreadHandler } from './SpChartManager';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { TraceRowConfig } from '../trace/base/TraceRowConfig';
import { ProcessMemStruct } from '../../bean/ProcessMemStruct';
import { MemRender } from '../../database/ui-worker/ProcedureWorkerMem';
import { FuncRender, FuncStruct } from '../../database/ui-worker/ProcedureWorkerFunc';
import { ThreadRender } from '../../database/ui-worker/ProcedureWorkerThread';
import { promises } from 'dns';
const FOLD_HEIGHT = 24;
export class SpImportUserPluginsChart {
	private trace: SpSystemTrace;
	static userPluginData: [];
	private traceId?: string | undefined;

	constructor(trace: SpSystemTrace) {
		this.trace = trace;
	}

	async init(traceId?: string): Promise<void> {
		this.traceId = traceId;
		//@ts-ignore
		let folderRow = this.createFolderRow(this.traceId);
		folderRow.rowId = 'UserPluginsRows';
		folderRow.rowType = TraceRow.ROW_TYPE_IMPORT;
		folderRow.name = 'UserPluginsRows';
		folderRow.selectChangeHandler = this.trace.selectChangeHandler;
		this.trace.rowsEL?.appendChild(folderRow);
	}

	createFolderRow(traceId?: string): TraceRow<BaseStruct> {
		let folder = TraceRow.skeleton<BaseStruct>(traceId);
		folder.rowParentId = '';
		folder.folder = true;
		folder.style.height = '40px';
		folder.rowHidden = folder.expansion;
		folder.summaryProtoPid = [];
		folder.setAttribute('children', '');
		folder.supplier = folderSupplier();
		folder.onThreadHandler = folderThreadHandler(folder, this.trace);
		folder.addRowSampleUpload();
		this.addTraceRowEventListener(folder);
		return folder;
	}

	/**
	 * 监听文件上传事件
	 * @param row 
	 * @param start_ts 
	 */
	addTraceRowEventListener(row: TraceRow<BaseStruct>): void {
		row.uploadEl?.addEventListener('sample-file-change', (e: unknown) => {
			this.getJsonData(e).then((res: unknown) => {
				if (row.childrenList.length) { this.handleDynamicRowList(row); }
				//@ts-ignore
				if (res && res.data) {
					let len = TraceRowConfig.allTraceRowList.length;
					//@ts-ignore
					res.data.forEach(item => {
						//支持mem，thread, func
						if (![TraceRow.ROW_TYPE_MEM, TraceRow.ROW_TYPE_THREAD, TraceRow.ROW_TYPE_FUNC].includes(item.rowType)) {
							return;
						}
						for (let index = 0; index < len - 1; index++) {
							const element = TraceRowConfig.allTraceRowList[index];
							if (element.rowType === item.rowType && element.name === item.threadName) {
								//@ts-ignore
								let parentRows = this.trace.shadowRoot?.querySelectorAll<TraceRow<unknown>>(`trace-row[row-id='${element.rowParentId}']`);
								let childRow = TraceRow.skeleton<BaseStruct>();
								//@ts-ignore
								childRow.rowId = element.rowId;
								childRow.rowType = element.rowType;
								childRow.protoParentId = parentRows?.[0].name;
								childRow.protoPid = element.rowParentId!;
								childRow.rowParentId = 'UserPluginsRows';
								childRow.rowHidden = element.rowHidden;
								childRow.style.width = childRow.style.width;
								childRow.style.height = element.style.height;
								childRow.enableCollapseChart(FOLD_HEIGHT, this.trace);
								//@ts-ignore
								childRow.name = element.name;
								childRow.setAttribute('children', '');
								childRow.needRefresh = true;
								childRow.favoriteChangeHandler = element.favoriteChangeHandler;
								childRow.selectChangeHandler = element.selectChangeHandler;
								this.addDrawAttributes(item, childRow, element);
								row.summaryProtoPid!.push(childRow.protoPid);
								row.addChildTraceRow(childRow);
							};
						};
					});
					row.expansion = true;
				};
				this.trace.refreshCanvas(false);
			});
		});
	}
	//清空row-parent-id='UserPluginsRows'动态添加的子Row的list数据
	handleDynamicRowList(row: TraceRow<BaseStruct>): void {
		row.summaryProtoPid = [];
		// 使用querySelectorAll找到所有row-parent-id='UserPluginsRows'的div元素
		//@ts-ignore
		let childRows: Array<TraceRow<unknown>> = [
			//@ts-ignore
			...this.trace.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='UserPluginsRows']`),
		];
		// 遍历这些元素  
		childRows.forEach((div) => {
			// 如果等于，则从父节点中删除该元素  
			if (div.parentNode) {
				div.parentNode.removeChild(div);
			}
		});
		//删除上一次导入file添加的row
		TraceRowConfig.allTraceRowList = TraceRowConfig.allTraceRowList.filter(item => item.rowParentId !== 'UserPluginsRows');
		row.expansion = false;
		row.childrenList = [];
	}

	addDrawAttributes(item: { rowType: string, threadName: string }, childRow: TraceRow<BaseStruct>, element: unknown): void {
		//@ts-ignore
		if (element.supplier) {
			//@ts-ignore
			childRow.supplier = async (): Promise<unknown> => {
				//@ts-ignore
				let res = await element.supplier!();
				return res;
			};
			//@ts-ignore
		} else if (element.supplierFrame) {
			//@ts-ignore
			childRow.supplierFrame = async (): Promise<unknown> => {
				//@ts-ignore
				let res = await element.supplierFrame!();
				return res;
			};
		}
		if (item.rowType === TraceRow.ROW_TYPE_MEM) {//处理mem
			childRow.findHoverStruct = (): void => {
				//@ts-ignore
				ProcessMemStruct.hoverProcessMemStruct = childRow.getHoverStruct(false);
			};
			childRow.focusHandler = (): void => {
				if (childRow.hoverY <= 5 || childRow.hoverY >= 35) {
					ProcessMemStruct.hoverProcessMemStruct = undefined;
				}
				this.trace.displayTip(
					childRow,
					ProcessMemStruct.hoverProcessMemStruct,
					`<span>${ProcessMemStruct.hoverProcessMemStruct?.value || '0'}</span>`
				);
			};
			childRow.onThreadHandler = rowThreadHandler<MemRender>('mem', 'context',
				//@ts-ignore
				{ type: `mem ${element.rowId} ${element.name}` }, childRow, this.trace);
		} else if (item.rowType === TraceRow.ROW_TYPE_FUNC) {
			//处理func
			//@ts-ignore
			if (element.asyncFuncName) {
				//@ts-ignore
				childRow.asyncFuncName = element.asyncFuncName;
				//@ts-ignore
				childRow.asyncFuncNamePID = element.asyncFuncNamePID;
				//@ts-ignore
				childRow.asyncFuncStartTID = element.asyncFuncStartTID;
			}
			//@ts-ignore
			if (element.asyncFuncThreadName) {
				//@ts-ignore
				childRow.asyncFuncThreadName = element.asyncFuncThreadName;
				//@ts-ignore
				childRow.asyncFuncNamePID = element.asyncFuncNamePID;
			}
			childRow.findHoverStruct = (): void => {
				//@ts-ignore
				FuncStruct.hoverFuncStruct = childRow.getHoverStruct();
			};
			childRow.onThreadHandler = rowThreadHandler<FuncRender>('func', 'context',
				//@ts-ignore
				{ type: '' }, childRow, this.trace);
		} else if (item.rowType === TraceRow.ROW_TYPE_THREAD) {
			//处理thread
			childRow.onThreadHandler = rowThreadHandler<ThreadRender>('thread', 'context',
				{ type: '', translateY: childRow.translateY }, childRow, this.trace);
		}
	}
	/**
	 * 获取上传的文件内容 转为json格式
	 * @param file 
	 * @returns 
	 */
	getJsonData(file: unknown): Promise<unknown> {
		return new Promise((resolve, reject) => {
			let reader = new FileReader();
			//@ts-ignore
			reader.readAsText(file.detail || file);
			reader.onloadend = (e: unknown): void => {
				//@ts-ignore
				const fileContent = e.target?.result;
				try {
					resolve(JSON.parse(fileContent));
					document.dispatchEvent(
						new CustomEvent('file-correct')
					);
					SpStatisticsHttpUtil.addOrdinaryVisitAction({
						event: 'seach-row',
						action: 'seach-row',
					});
				} catch (error) {
					document.dispatchEvent(
						new CustomEvent('file-error')
					);
				}
			};
		});
	}
}
export const folderThreadHandler = (row: TraceRow<BaseStruct>, trace: SpSystemTrace) => {
	return (useCache: boolean): void => {
		row.canvasSave(trace.canvasPanelCtx!);
		if (row.expansion) {
			// @ts-ignore
			trace.canvasPanelCtx?.clearRect(0, 0, row.frame.width, row.frame.height);
		} else {
			(renders.empty as EmptyRender).renderMainThread(
				{
					context: trace.canvasPanelCtx,
					useCache: useCache,
					type: '',
				},
				row
			);
		}
		row.canvasRestore(trace.canvasPanelCtx!, trace);
	};
};

