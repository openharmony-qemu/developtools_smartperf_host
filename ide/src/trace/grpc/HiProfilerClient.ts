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

import { Address, ProfilerClient } from './ProfilerClient';

export class HiProfilerClient {
  private _client: ProfilerClient;
  private _address: Address;

  public constructor(clients: ProfilerClient, addr: Address) {
    this._client = clients;
    this._address = addr;
  }

  get client(): ProfilerClient {
    return this._client;
  }

  set client(value: ProfilerClient) {
    this._client = value;
  }

  get address(): Address {
    return this._address;
  }

  set address(value: Address) {
    this._address = value;
  }

  public getProfilerClient(): ProfilerClient {
    return this._client;
  }

  public getCapabilities() {
    // this.client.start()
    // this.client.getCapabilities(
  }

  public createSession() {
    // this.client.createSession(
  }

  public startSession() {
    // this.client.startSession(
  }

  public stopSession() {
    // this.client.stopSession(
  }

  public destroySession() {
    // this.client.destroySession(
  }

  public keepSession() {
    // this.client.keepSession(
  }
}
