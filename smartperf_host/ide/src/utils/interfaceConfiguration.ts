/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

import { ServerConfig } from './interfaceConfigurationBean';

class ConfigStorage {
    private static instance: ConfigStorage;
    private currentConfig: ServerConfig | null = null;

    private constructor() { }

    public static getInstance(): ConfigStorage {
        if (!ConfigStorage.instance) {
            ConfigStorage.instance = new ConfigStorage();
        }
        return ConfigStorage.instance;
    }

    public setConfig(config: ServerConfig): void {
        this.currentConfig = config;
    }

    public getConfig(): ServerConfig | null {
        return this.currentConfig;
    }
}

export const InterfaceConfigManager = ConfigStorage.getInstance();