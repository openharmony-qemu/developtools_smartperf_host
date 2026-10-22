const childProcess = require('child_process');
const { execSync, spawnSync } = childProcess;
const fs = require('fs');
const path = require('path');

// SDK_URL is the official download path
const SDK_URL = 'https://repo.huaweicloud.com/harmonyos/os/7.0-Release/ohos-sdk-windows_linux-public.tar.gz';
const TAR_INNER_PATH = 'ohos-sdk/ohos/toolchains-ohos-x64-26.0.0.38-Beta.zip';
const ZIP_INNER_PATH = 'toolchains/lib/binary-sign-tool';
const SIGNING_DIR = path.join(__dirname, 'signing');
const TOOL_PATH = path.join(SIGNING_DIR, 'binary-sign-tool');
const SDK_CACHE = path.join(SIGNING_DIR, 'ohos-sdk-windows_linux-public.tar.gz');
const SELFSIGN_SRC = path.join(__dirname, 'selfsign.go');
const SELFSIGN_EXE = path.join(SIGNING_DIR, 'selfsign.exe');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const DIST_TOOL = path.join(DIST_DIR, 'binary-sign-tool');

function downloadSdkSync() {
  if (fs.existsSync(SDK_CACHE)) {
    return true;
  }
  if (!fs.existsSync(SIGNING_DIR)) {
    fs.mkdirSync(SIGNING_DIR, { recursive: true });
  }
  console.log('[sign-ohos] downloading SDK (3.2GB) from mirror, please wait...');
  try {
    const psCmd = `$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '${SDK_URL}' -OutFile '${SDK_CACHE}' -UseBasicParsing`;
    execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'inherit', timeout: 600000 });
    console.log('[sign-ohos] SDK downloaded');
    return true;
  } catch (e) {
    console.warn('[sign-ohos] SDK download failed:', e.message);
    return false;
  }
}

function extractTool() {
  const tmpDir = path.join(SIGNING_DIR, '.tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  try {
    execSync(`tar -xzf "${SDK_CACHE}" -C "${tmpDir}" "${TAR_INNER_PATH}"`, { stdio: 'pipe' });
    const zipPath = path.join(tmpDir, TAR_INNER_PATH);
    if (!fs.existsSync(zipPath)) {
      console.warn('[sign-ohos] toolchains zip not found after tar extraction');
      return false;
    }
    const zipExtractDir = path.join(tmpDir, 'toolchains');
    if (fs.existsSync(zipExtractDir)) {
      fs.rmSync(zipExtractDir, { recursive: true });
    }
    fs.mkdirSync(zipExtractDir, { recursive: true });
    execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${zipExtractDir}' -Force"`, { stdio: 'pipe' });
    const toolSrc = path.join(zipExtractDir, ZIP_INNER_PATH);
    if (!fs.existsSync(toolSrc)) {
      console.warn('[sign-ohos] binary-sign-tool not found in zip');
      return false;
    }
    fs.copyFileSync(toolSrc, TOOL_PATH);
    console.log('[sign-ohos] binary-sign-tool extracted');
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {}
    return true;
  } catch (e) {
    console.warn('[sign-ohos] extraction failed:', e.message);
    return false;
  }
}

function buildSelfsign() {
  if (fs.existsSync(SELFSIGN_EXE)) {
    return true;
  }
  if (!fs.existsSync(SELFSIGN_SRC)) {
    console.warn('[sign-ohos] selfsign.go not found, cannot pre-sign tool');
    return false;
  }
  try {
    execSync(`go build -o "${SELFSIGN_EXE}" "${SELFSIGN_SRC}"`, {
      cwd: __dirname,
      stdio: 'pipe',
      env: { ...process.env, GOOS: 'windows', GOARCH: 'amd64', CGO_ENABLED: '0' },
    });
    console.log('[sign-ohos] selfsign.exe built');
    return true;
  } catch (e) {
    console.warn('[sign-ohos] build selfsign.exe failed:', e.message);
    return false;
  }
}

function preSignTool(toolPath) {
  if (!fs.existsSync(SELFSIGN_EXE)) {
    console.warn('[sign-ohos] selfsign.exe not available, cannot pre-sign');
    return false;
  }
  try {
    const r = spawnSync(SELFSIGN_EXE, [toolPath, '--force'], { stdio: 'pipe' });
    if (r.status === 0) {
      console.log('[sign-ohos] binary-sign-tool pre-signed with selfsign');
      return true;
    }
    console.warn('[sign-ohos] pre-sign failed, exit code:', r.status);
    if (r.stderr) {
      console.warn(r.stderr.toString());
    }
    return false;
  } catch (e) {
    console.warn('[sign-ohos] pre-sign failed:', e.message);
    return false;
  }
}

function ensureToolInDist() {
  if (!fs.existsSync(DIST_DIR)) {
    console.log('[sign-ohos] dist/ not found, skip');
    return;
  }
  if (!fs.existsSync(TOOL_PATH)) {
    if (!downloadSdkSync()) {
      console.warn('[sign-ohos] cannot obtain SDK, skip');
      return;
    }
    if (!extractTool()) {
      console.warn('[sign-ohos] cannot extract tool, skip');
      return;
    }
  }
  buildSelfsign();
  preSignTool(TOOL_PATH);
  fs.copyFileSync(TOOL_PATH, DIST_TOOL);
  console.log('[sign-ohos] binary-sign-tool copied to dist/');
}

ensureToolInDist();
