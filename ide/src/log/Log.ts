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

export enum LogLevel {
  OFF = Number.MAX_VALUE,
  ERROR = 4000,
  WARN = 3000,
  INFO = 2000,
  DEBUG = 1000,
  TRACE = 500,
  ALL = Number.MIN_VALUE,
}

export const error = (message?: any, ...optionalParams: any[]) => {
  SpLog.logger(LogLevel.ERROR, message, ...optionalParams);
};
export const warn = (message?: any, ...optionalParams: any[]) => {
  SpLog.logger(LogLevel.WARN, message, ...optionalParams);
};
export const info = (message?: any, ...optionalParams: any[]) => {
  SpLog.logger(LogLevel.INFO, message, ...optionalParams);
};
export const debug = (message?: any, ...optionalParams: any[]) => {
  SpLog.logger(LogLevel.DEBUG, message, ...optionalParams);
};
export const trace = (message?: any, ...optionalParams: any[]) => {
  SpLog.logger(LogLevel.TRACE, message, ...optionalParams);
};
export const log = (message?: any) => {
  SpLog.logger(LogLevel.TRACE, message);
};

class SpLog {
  private static nowLogLevel: LogLevel = LogLevel.OFF;

  public static getNowLogLevel(): LogLevel {
    return this.nowLogLevel;
  }

  public static setLogLevel(logLevel: LogLevel) {
    SpLog.nowLogLevel = logLevel;
  }
  private static now(): string {
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()}`;
    return timeString;
  }

  public static logger(logLevel: LogLevel, message?: any, ...optionalParams: any[]) {
    if (logLevel >= SpLog.nowLogLevel) {
      switch (logLevel) {
        case LogLevel.ERROR:
          console.error(message, ...optionalParams, this.now());
          break;
        case LogLevel.WARN:
          console.warn(message, ...optionalParams, this.now());
          break;
        case LogLevel.INFO:
          console.info(message, ...optionalParams, this.now());
          break;
        case LogLevel.DEBUG:
          console.debug(message, ...optionalParams, this.now());
          break;
        case LogLevel.TRACE:
          console.trace(message, ...optionalParams, this.now());
          break;
        default:
          console.log(message, this.now());
      }
    }
  }
}
