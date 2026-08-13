import { BrowserBridge } from '../src/browserBridge';

describe('BrowserBridge', () => {
  it('isConnected returns false initially', () => {
    const bridge = new BrowserBridge({ autoConnect: false });
    expect(bridge.isConnected()).toBe(false);
    bridge.disconnect();
  });

  it('sendUiCommand returns sent:false when not connected', async () => {
    const bridge = new BrowserBridge({ autoConnect: false });
    const result = await bridge.sendUiCommand(1, { startTime: 1000 });
    expect(result.sent).toBe(false);
    bridge.disconnect();
  });

  it('sendUiCommand returns error message when extension service unavailable', async () => {
    const bridge = new BrowserBridge({ autoConnect: false });
    const result = await bridge.sendUiCommand(1, { startTime: 1000 });
    expect(result.sent).toBe(false);
    expect(result.result.success).toBe(false);
    expect(result.result.message).toContain('Extension service not available');
    bridge.disconnect();
  });

  it('disconnect is idempotent', () => {
    const bridge = new BrowserBridge({ autoConnect: false });
    bridge.disconnect();
    bridge.disconnect();
  });

  it('does not auto-connect when autoConnect is false', () => {
    const bridge = new BrowserBridge({ autoConnect: false });
    expect(bridge.isConnected()).toBe(false);
    bridge.disconnect();
  });
});
