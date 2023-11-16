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

export class ClientVessel {
  private _port: string | number | undefined;
  private _host: string | undefined;

  get port(): string | number | undefined {
    return this._port;
  }

  set port(value: string | number | undefined) {
    this._port = value;
  }

  get host(): string | undefined {
    return this._host;
  }

  set host(value: string | undefined) {
    this._host = value;
  }

  public registryClient(target: any, path: string) {}

  public start() {
    this.loadSettings();
    this._registryClient();
  }

  private loadSettings() {
    let { host, port } = SettingRegistry.settings;
    this._host = host;
    this._port = port;
  }

  private _registryClient() {}
}

export class SettingRegistry {
  static settings: Settings;

  static registry(settings: Settings) {
    this.settings = settings;
  }
}

export interface Settings {
  port: string | number;

  host?: string;
}
