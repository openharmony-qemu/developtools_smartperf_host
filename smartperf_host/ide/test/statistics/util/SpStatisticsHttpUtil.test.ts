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

import { SpStatisticsHttpUtil } from '../../../src/statistics/util/SpStatisticsHttpUtil';

describe('SpStatisticsHttpUtil Test', () => {
  let originalXMLHttpRequest;
  let mockXMLHttpRequest;
  let originalFetch;
  let mockFetch;
  let originalXMLHttp;
  let mockXMLHttp;

  beforeAll(() => {
    // Mock XMLHttpRequest
    originalXMLHttpRequest = global.XMLHttpRequest;
    mockXMLHttpRequest = jest.fn(() => ({
      open: jest.fn(),
      send: jest.fn(),
      status: 200,
      getResponseHeader: (header) => {
        if (header === 'request_info') {
          return 'mocked_request_info';
        }
      },
    }));

    // Mock fetch
    originalFetch = global.fetch;
    mockFetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve('1000'),
      })
    );
    global.fetch = mockFetch;

    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:',
        host: 'example.com',
      },
    });
  });
  afterAll(() => {
    global.XMLHttpRequest = originalXMLHttpRequest;
    global.fetch = originalFetch;
    global.XMLHttp = originalXMLHttp 
  });
  afterEach(() => {
    mockXMLHttpRequest.mockClear();
    mockFetch.mockClear();
  });
  it('SpStatisticsHttpUtilTest01', () => {
    const serverInfo = SpStatisticsHttpUtil.getRequestServerInfo();
    expect(serverInfo).toBe('');
  });
  it('SpStatisticsHttpUtilTest02', async () => {
    await SpStatisticsHttpUtil.getServerTime();
    expect(mockFetch).toHaveBeenCalledWith('https:///serverTime');
    expect(SpStatisticsHttpUtil.serverTime).toBe(0);
  });
  it('SpStatisticsHttpUtilTest03', async () => {
    SpStatisticsHttpUtil.pauseRetry = true;
    await SpStatisticsHttpUtil.getServerTime();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(SpStatisticsHttpUtil.serverTime).toBe(1000);
  });
});