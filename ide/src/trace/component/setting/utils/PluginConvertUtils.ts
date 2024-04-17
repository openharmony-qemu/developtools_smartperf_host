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

export class PluginConvertUtils {
  private static crlf: string = '\n';
  private static leftBrace: string = '{';
  private static rightBrace: string = '}';
  static pluginConfig: any[] = [];

  public static createHdcCmd(requestString: string, outputPath: string, time: number) {
    return (
      'hiprofiler_cmd \\' +
      this.crlf +
      '  -c - \\' +
      this.crlf +
      '  -o ' +
      outputPath +
      ' \\' +
      this.crlf +
      '  -t ' +
      time +
      ' \\' +
      this.crlf +
      '  -s \\' +
      this.crlf +
      '  -k \\' +
      this.crlf +
      '<<CONFIG' +
      requestString +
      'CONFIG'
    );
  }

  public static BeanToCmdTxt(bean: any, needColon: boolean): string {
    PluginConvertUtils.pluginConfig = bean.pluginConfigs;
    return this.handleObj(bean, 0, needColon, 1);
  }

  public static BeanToCmdTxtWithObjName(bean: any, needColon: boolean, objName: string, spacesNumber: number): string {
    return objName + ': {' + this.handleObj(bean, 0, needColon, spacesNumber) + '}';
  }

  private static handleObj(bean: object, indentation: number, needColon: boolean, spacesNumber: number): string {
    let prefixText: string = '';
    if (indentation == 0) {
      prefixText = prefixText + this.crlf;
    } else {
      prefixText = prefixText + ' '.repeat(spacesNumber) + this.leftBrace + this.crlf;
    }
    if (bean) {
      prefixText = this.getPrefixText(prefixText, indentation, needColon, spacesNumber, bean);
    }
    if (indentation == 0) {
      return prefixText;
    } else {
      return prefixText + ' '.repeat(spacesNumber).repeat(indentation) + this.rightBrace;
    }
  }

  private static getPrefixText(prefixText: string, indentation: number, needColon: boolean, spacesNumber: number, bean: any): string {
    // @ts-ignore
    for (const [key, value] of Object.entries(bean)) {
      const repeatedKey = Array.isArray(value);
      if (repeatedKey) {
        prefixText = prefixText + this.handleArray(key, value, indentation, needColon, spacesNumber);
      } else {
        switch (typeof value) {
          case 'bigint':
            prefixText = this.getMontageStrings(prefixText, spacesNumber, indentation, key, value);
            break;
          case 'boolean':
            prefixText = this.getMontageStrings(prefixText, spacesNumber, indentation, key, value);
            break;
          case 'number':
            if (value == 0 && !needColon) {
              break;
            }
            prefixText = this.getMontageStrings(prefixText, spacesNumber, indentation, key, value);
            break;
          case 'string':
            if (value == '') {
              break;
            }
            prefixText = this.handleObjByStr(prefixText, value, spacesNumber, key, indentation);
            break;
          case 'object':
          default:
            prefixText = this.handleObjByDefault(prefixText, value, spacesNumber, key, indentation, needColon);
            break;
        }
      }
    }
    return prefixText;
  }

  private static handleObjByDefault(
    prefixText: string,
    value: any,
    spacesNumber: number,
    key: string,
    indentation: number,
    needColon: boolean
  ): string {
    if (needColon) {
      prefixText =
        prefixText +
        ' '.repeat(spacesNumber).repeat(indentation + 1) +
        this.humpToSnake(key) +
        ': ' +
        this.handleObj(value, indentation + 1, needColon, spacesNumber) +
        '' +
        this.crlf;
    } else {
      prefixText =
        prefixText +
        ' '.repeat(spacesNumber).repeat(indentation + 1) +
        this.humpToSnake(key) +
        this.handleObj(value, indentation + 1, needColon, spacesNumber) +
        '' +
        this.crlf;
    }
    return prefixText;
  }

  private static handleObjByStr(prefixText: string, value: any, spacesNumber: number, key: string, indentation: number): string {
    if (LevelConfigEnumList.indexOf(value) >= 0 || value.startsWith('IO_REPORT')) {
      prefixText =
        prefixText +
        ' '.repeat(spacesNumber).repeat(indentation + 1) +
        this.humpToSnake(key) +
        ': ' +
        value.toString() +
        this.crlf;
    } else {
      prefixText =
        prefixText +
        ' '.repeat(spacesNumber).repeat(indentation + 1) +
        this.humpToSnake(key) +
        ': "' +
        value.toString() +
        '"' +
        this.crlf;
    }
    return prefixText;
  }

  private static handleArray(
    key: string,
    arr: Array<Object>,
    indentation: number,
    needColon: boolean,
    spacesNumber: number
  ): string {
    let text = '';
    arr.forEach((arrValue) => {
      switch (typeof arrValue) {
        case 'bigint':
          text = this.handleArrayByBigint(text, spacesNumber, indentation, key, arrValue);
          break;
        case 'boolean':
          text = this.handleArrayByBoolean(text, spacesNumber, indentation, key, arrValue);
          break;
        case 'number':
          text = this.handleArrayByNumber(text, spacesNumber, indentation, key, arrValue);
          break;
        case 'string':
          if (arrValue == '') {
            break;
          }
          text = this.handleArrayByStr(text, spacesNumber, indentation, key, arrValue);
          break;
        case 'object':
        default:
          text = this.handleArrayByDefault(text, spacesNumber, indentation, key, arrValue, needColon);
      }
    });
    return text;
  }

  private static handleArrayByBigint(
    text: string,
    spacesNumber: number,
    indentation: number,
    key: string,
    arrValue: any
  ): string {
    return text + ' '.repeat(spacesNumber).repeat(indentation + 1) +
      this.humpToSnake(key) + ': ' + arrValue.toString() + this.crlf;
  }

  private static handleArrayByBoolean(
    text: string,
    spacesNumber: number,
    indentation: number,
    key: string,
    arrValue: any
  ): string {
    return text + ' '.repeat(spacesNumber).repeat(indentation + 1) + this.humpToSnake(key) + ': ' +
      arrValue.toString() + this.crlf;
  }

  private static handleArrayByNumber(
    text: string,
    spacesNumber: number,
    indentation: number,
    key: string,
    arrValue: any
  ): string {
    return text + ' '.repeat(spacesNumber).repeat(indentation + 1) + this.humpToSnake(key) + ': ' +
      arrValue.toString() + this.crlf;
  }

  private static handleArrayByStr(
    text: string,
    spacesNumber: number,
    indentation: number,
    key: string,
    arrValue: any
  ): string {
    if (arrValue.startsWith('VMEMINFO') || arrValue.startsWith('PMEM')) {
      text =
        text +
        ' '.repeat(spacesNumber).repeat(indentation + 1) +
        this.humpToSnake(key) +
        ': ' +
        arrValue.toString() +
        this.crlf;
    } else {
      text =
        text +
        ' '.repeat(spacesNumber).repeat(indentation + 1) +
        this.humpToSnake(key) +
        ': "' +
        arrValue.toString() +
        '"' +
        this.crlf;
    }
    return text;
  }

  private static handleArrayByDefault(
    text: string,
    spacesNumber: number,
    indentation: number,
    key: string,
    arrValue: any,
    needColon: boolean
  ): string {
    if (needColon) {
      text =
        text +
        ' '.repeat(spacesNumber).repeat(indentation + 1) +
        this.humpToSnake(key) +
        ': ' +
        this.handleObj(arrValue, indentation + 1, needColon, spacesNumber) +
        '' +
        this.crlf;
    } else {
      text =
        text +
        ' '.repeat(spacesNumber).repeat(indentation + 1) +
        this.humpToSnake(key) +
        this.handleObj(arrValue, indentation + 1, needColon, spacesNumber) +
        '' +
        this.crlf;
    }
    return text;
  }

  // 驼峰转snake
  private static humpToSnake(humpString: string): string {
    return humpString.replace(/[A-Z]/g, (value) => '_' + value.toLowerCase());
  }

  private static getMontageStrings<T extends Object>(
    prefixText: string,
    spacesNumber: number,
    indentation: number,
    key: string,
    value: T
  ): string {
    return (
      prefixText +
      ' '.repeat(spacesNumber).repeat(indentation + 1) +
      this.humpToSnake(key) +
      ': ' +
      value.toString() +
      this.crlf
    );
  }
}

const LevelConfigEnumList = ['LEVEL_UNSPECIFIED', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
