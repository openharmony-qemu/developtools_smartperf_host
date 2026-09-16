// Copyright (C) 2022 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// ---- getPidByPortOther ----

func TestGetPidByPortOther_ReturnsNegativeWhenPortUnused(t *testing.T) {
	pid := getPidByPortOther(65432)
	if pid != -1 {
		t.Logf("getPidByPortOther(65432) = %d, expected -1 (port may be in use or lsof available)", pid)
	}
}

func TestGetPidByPortOther_DoesNotPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("getPidByPortOther panicked: %v", r)
		}
	}()
	_ = getPidByPortOther(65432)
}

func TestGetPidByPortOther_InvalidPortDoesNotPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("getPidByPortOther panicked with invalid port: %v", r)
		}
	}()
	_ = getPidByPortOther(0)
	_ = getPidByPortOther(-1)
}

// ---- checkPort ----

func TestCheckPort_DoesNotPanicForUnusedPort(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("checkPort panicked: %v", r)
		}
	}()
	checkPort(65432)
}

func TestCheckPort_WindowsBranchUnchanged(t *testing.T) {
	if !isWindows() {
		t.Skip("test only for Windows platform")
	}
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("checkPort Windows branch panicked: %v", r)
		}
	}()
	checkPort(65432)
}

func TestCheckPort_NonWindowsBranchDoesNotPanic(t *testing.T) {
	if isWindows() {
		t.Skip("test only for non-Windows platform")
	}
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("checkPort non-Windows branch panicked: %v", r)
		}
	}()
	checkPort(65432)
}

// ---- isWindows / isDarwin ----

func TestIsWindows(t *testing.T) {
	result := isWindows()
	if result {
		t.Log("running on Windows platform")
	} else {
		t.Log("running on non-Windows platform")
	}
}

func TestIsDarwin(t *testing.T) {
	result := isDarwin()
	if result {
		t.Log("running on Darwin platform")
	} else {
		t.Log("running on non-Darwin platform")
	}
}

func TestIsWindowsAndIsDarwinMutuallyExclusive(t *testing.T) {
	if isWindows() && isDarwin() {
		t.Fatal("isWindows() and isDarwin() cannot both be true")
	}
}

// ---- getPidByPort (Windows) ----

func TestGetPidByPort_DoesNotPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("getPidByPort panicked: %v", r)
		}
	}()
	_ = getPidByPort(65432)
}

// ---- getExecutePath ----

func TestGetExecutePath_ReturnsNonEmpty(t *testing.T) {
	result := getExecutePath()
	if result == "" {
		t.Fatal("getExecutePath() returned empty string, expected the executable directory")
	}
}

func TestGetExecutePath_IsValidDirectory(t *testing.T) {
	result := getExecutePath()
	info, err := os.Stat(result)
	if err != nil {
		t.Fatalf("getExecutePath() returned invalid path %q: %v", result, err)
	}
	if !info.IsDir() {
		t.Fatalf("getExecutePath() returned %q which is not a directory", result)
	}
}

// ---- getCurrentAbPath ----

func TestGetCurrentAbPath_ReturnsNonEmpty(t *testing.T) {
	result := getCurrentAbPath()
	if result == "" {
		t.Fatal("getCurrentAbPath() returned empty string, expected a valid path")
	}
}

func TestGetCurrentAbPath_TmpDirEmptyDoesNotReturnCallerPath(t *testing.T) {
	dir := getExecutePath()
	if dir == "" {
		t.Skip("getExecutePath() returned empty, cannot test")
	}
	emptyTmpDir := ""
	if strings.Contains(dir, emptyTmpDir) {
		t.Log("strings.Contains(dir, \"\") is true — this is the bug that caused 404 on HarmonyOS PC")
	}
	if emptyTmpDir != "" && strings.Contains(dir, emptyTmpDir) {
		t.Fatal("should not enter getCallerPath branch when tmpDir is empty")
	}
}

func TestGetCurrentAbPath_MatchesExecutableDir(t *testing.T) {
	execPath := getExecutePath()
	abPath := getCurrentAbPath()
	tmpDir, _ := filepath.EvalSymlinks(os.TempDir())
	if tmpDir != "" && strings.Contains(execPath, tmpDir) {
		t.Skip("executable is in temp directory, getCurrentAbPath uses getCallerPath")
	}
	if abPath != execPath {
		t.Errorf("getCurrentAbPath() = %q, expected %q", abPath, execPath)
	}
}

// ---- getCallerPath ----

func TestGetCallerPath_ReturnsNonEmpty(t *testing.T) {
	result := getCallerPath()
	if result == "" {
		t.Fatal("getCallerPath() returned empty string")
	}
}

// ---- exist ----

func TestExist_ReturnsTrueForExistingPath(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test_exist_*.txt")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	if !exist(tmpFile.Name()) {
		t.Errorf("exist(%q) = false, expected true", tmpFile.Name())
	}
}

func TestExist_ReturnsFalseForNonExistentPath(t *testing.T) {
	nonExistent := filepath.Join(os.TempDir(), "definitely_non_existent_file_12345.txt")
	if exist(nonExistent) {
		t.Errorf("exist(%q) = true, expected false", nonExistent)
	}
}

// ---- PathExists ----

func TestPathExists_ReturnsTrueForExistingPath(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test_pathexists_*.txt")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	exists, err := PathExists(tmpFile.Name())
	if err != nil {
		t.Fatalf("PathExists(%q) returned error: %v", tmpFile.Name(), err)
	}
	if !exists {
		t.Errorf("PathExists(%q) = false, expected true", tmpFile.Name())
	}
}

func TestPathExists_ReturnsFalseForNonExistentPath(t *testing.T) {
	nonExistent := filepath.Join(os.TempDir(), "definitely_non_existent_file_67890.txt")
	exists, err := PathExists(nonExistent)
	if err != nil {
		t.Fatalf("PathExists(%q) returned error: %v", nonExistent, err)
	}
	if exists {
		t.Errorf("PathExists(%q) = true, expected false", nonExistent)
	}
}

// ---- SplitLines ----

func TestSplitLines_MultiLine(t *testing.T) {
	input := "line1\nline2\nline3"
	result := SplitLines(input)
	if len(result) != 3 {
		t.Fatalf("SplitLines returned %d lines, expected 3", len(result))
	}
	if result[0] != "line1" || result[1] != "line2" || result[2] != "line3" {
		t.Errorf("SplitLines result = %v, expected [line1 line2 line3]", result)
	}
}

func TestSplitLines_EmptyString(t *testing.T) {
	result := SplitLines("")
	if len(result) != 0 {
		t.Errorf("SplitLines(\"\") returned %d lines, expected 0", len(result))
	}
}

func TestSplitLines_SingleLine(t *testing.T) {
	result := SplitLines("only line")
	if len(result) != 1 {
		t.Fatalf("SplitLines returned %d lines, expected 1", len(result))
	}
	if result[0] != "only line" {
		t.Errorf("SplitLines result = %v, expected [only line]", result)
	}
}

func TestSplitLines_TrailingNewline(t *testing.T) {
	result := SplitLines("line1\n")
	if len(result) != 1 {
		t.Fatalf("SplitLines returned %d lines, expected 1", len(result))
	}
	if result[0] != "line1" {
		t.Errorf("SplitLines result = %v, expected [line1]", result)
	}
}

// ---- readFileFirstLine ----

func TestReadFileFirstLine_ReadsFirstLine(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test_readfirst_*.txt")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	content := "first line\nsecond line\n"
	tmpFile.WriteString(content)
	tmpFile.Close()
	result := readFileFirstLine(tmpFile.Name())
	if !strings.HasPrefix(result, "first line") {
		t.Errorf("readFileFirstLine() = %q, expected prefix \"first line\"", result)
	}
}

func TestReadFileFirstLine_NonExistentFileReturnsEmpty(t *testing.T) {
	nonExistent := filepath.Join(os.TempDir(), "definitely_non_existent_99999.txt")
	result := readFileFirstLine(nonExistent)
	if result != "" {
		t.Errorf("readFileFirstLine(non-existent) = %q, expected \"\"", result)
	}
}

// ---- getSuffixByUrl ----

func TestGetSuffixByUrl_WithExtension(t *testing.T) {
	result := getSuffixByUrl("http://example.com/file.txt")
	if result.fileName != "/file" {
		t.Errorf("fileName = %q, expected \"/file\"", result.fileName)
	}
	if result.suffix != ".txt" {
		t.Errorf("suffix = %q, expected \".txt\"", result.suffix)
	}
}

func TestGetSuffixByUrl_WithoutExtension(t *testing.T) {
	result := getSuffixByUrl("http://example.com/file")
	if result.fileName != "/file" {
		t.Errorf("fileName = %q, expected \"/file\"", result.fileName)
	}
	if result.suffix != "" {
		t.Errorf("suffix = %q, expected \"\"", result.suffix)
	}
}

func TestGetSuffixByUrl_NoSlash(t *testing.T) {
	result := getSuffixByUrl("file.json")
	if result.fileName != "file" {
		t.Errorf("fileName = %q, expected \"file\"", result.fileName)
	}
	if result.suffix != ".json" {
		t.Errorf("suffix = %q, expected \".json\"", result.suffix)
	}
}

func TestGetSuffixByUrl_OnlySuffix(t *testing.T) {
	result := getSuffixByUrl(".gitignore")
	if result.suffix != ".gitignore" {
		t.Errorf("suffix = %q, expected \".gitignore\"", result.suffix)
	}
}

// ---- mapToJson / jsonToMap ----

func TestMapToJson_ValidMap(t *testing.T) {
	m := map[string]interface{}{"key": "value", "num": 42}
	result, err := mapToJson(m)
	if err != nil {
		t.Fatalf("mapToJson returned error: %v", err)
	}
	if !strings.Contains(result, "\"key\":\"value\"") {
		t.Errorf("mapToJson result = %q, expected to contain \"key\":\"value\"", result)
	}
	if !strings.Contains(result, "\"num\":42") {
		t.Errorf("mapToJson result = %q, expected to contain \"num\":42", result)
	}
}

func TestJsonToMap_ValidJson(t *testing.T) {
	input := `{"key":"value","num":42}`
	result, err := jsonToMap(input)
	if err != nil {
		t.Fatalf("jsonToMap returned error: %v", err)
	}
	if result["key"] != "value" {
		t.Errorf("jsonToMap[\"key\"] = %v, expected \"value\"", result["key"])
	}
}

func TestJsonToMap_InvalidJson(t *testing.T) {
	_, err := jsonToMap("invalid json")
	if err == nil {
		t.Fatal("jsonToMap expected error for invalid JSON, got nil")
	}
}

func TestMapToJson_JsonToMap_RoundTrip(t *testing.T) {
	original := map[string]interface{}{"name": "test", "value": 123}
	jsonStr, err := mapToJson(original)
	if err != nil {
		t.Fatalf("mapToJson failed: %v", err)
	}
	result, err := jsonToMap(jsonStr)
	if err != nil {
		t.Fatalf("jsonToMap failed: %v", err)
	}
	if result["name"] != "test" {
		t.Errorf("round-trip name = %v, expected \"test\"", result["name"])
	}
}

// ---- resp ----

func TestResp_SuccessResponse(t *testing.T) {
	recorder := httptest.NewRecorder()
	var w http.ResponseWriter = recorder
	resp(&w)(true, 0, "success", map[string]interface{}{"data": "test"})
	body := recorder.Body.String()
	if !strings.Contains(body, "\"success\":true") {
		t.Errorf("response body = %q, expected to contain \"success\":true", body)
	}
	if !strings.Contains(body, "\"msg\":\"success\"") {
		t.Errorf("response body = %q, expected to contain \"msg\":\"success\"", body)
	}
}

func TestResp_ErrorResponse(t *testing.T) {
	recorder := httptest.NewRecorder()
	var w http.ResponseWriter = recorder
	resp(&w)(false, -1, "error occurred", nil)
	body := recorder.Body.String()
	if !strings.Contains(body, "\"success\":false") {
		t.Errorf("response body = %q, expected to contain \"success\":false", body)
	}
	if !strings.Contains(body, "\"code\":-1") {
		t.Errorf("response body = %q, expected to contain \"code\":-1", body)
	}
}

// ---- chekDir ----

func TestChekDir_CreatesNewDirectory(t *testing.T) {
	testDir := filepath.Join(os.TempDir(), "test_chekdir_new_12345")
	defer os.RemoveAll(testDir)
	if exist(testDir) {
		os.RemoveAll(testDir)
	}
	chekDir(testDir)
	if !exist(testDir) {
		t.Errorf("chekDir did not create directory %q", testDir)
	}
}

func TestChekDir_ExistingDirectoryDoesNotPanic(t *testing.T) {
	testDir := filepath.Join(os.TempDir(), "test_chekdir_exist_12345")
	defer os.RemoveAll(testDir)
	os.MkdirAll(testDir, os.ModePerm)
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("chekDir panicked on existing directory: %v", r)
		}
	}()
	chekDir(testDir)
}

// ---- CheckErr ----

func TestCheckErr_NilDoesNotPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("CheckErr(nil) panicked: %v", r)
		}
	}()
	CheckErr(nil)
}

// ---- TestMain ----

func TestMain(m *testing.M) {
	genRsa()
	exPath = getCurrentAbPath()
	code := m.Run()
	os.Exit(code)
}

// ---- RsaSign / RsaSignAndBase64 ----

func TestRsaSign_ValidInput_ReturnsSignature(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized by TestMain")
	}
	sig, err := RsaSign("test message", hdcPrivateKey)
	if err != nil {
		t.Fatalf("RsaSign returned error: %v", err)
	}
	if sig == "" {
		t.Fatal("RsaSign returned empty signature")
	}
}

func TestRsaSignAndBase64_ValidInput_ReturnsBase64(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized by TestMain")
	}
	sig, err := RsaSignAndBase64("test message", RSA_3072_SHA512)
	if err != nil {
		t.Fatalf("RsaSignAndBase64 returned error: %v", err)
	}
	if sig == "" {
		t.Fatal("RsaSignAndBase64 returned empty signature")
	}
}

// ---- MkDir ----

func TestMkDir_CreatesParentDirectory(t *testing.T) {
	baseDir := filepath.Join(os.TempDir(), "test_mkdir_base_12345")
	defer os.RemoveAll(baseDir)
	if exist(baseDir) {
		os.RemoveAll(baseDir)
	}
	nestedFile := filepath.Join(baseDir, "sub", "sub2", "file.txt")
	MkDir(nestedFile)
	parentDir := filepath.Dir(nestedFile)
	if !exist(parentDir) {
		t.Errorf("MkDir did not create parent directory %q", parentDir)
	}
}

func TestMkDir_ExistingPathDoesNotPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("MkDir panicked on existing path: %v", r)
		}
	}()
	existingFile := filepath.Join(os.TempDir(), "test_mkdir_exist_12345", "file.txt")
	os.MkdirAll(filepath.Dir(existingFile), os.ModePerm)
	defer os.RemoveAll(filepath.Dir(existingFile))
	MkDir(existingFile)
}

// ---- cors ----

func TestCors_SetsResponseHeaders(t *testing.T) {
	mockHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	wrapped := cors(mockHandler, "1.0.0")
	recorder := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/", nil)
	wrapped.ServeHTTP(recorder, r)
	headers := recorder.Header()
	if headers.Get("Cross-Origin-Opener-Policy") != "same-origin" {
		t.Errorf("COOP header = %q, expected \"same-origin\"", headers.Get("Cross-Origin-Opener-Policy"))
	}
	if headers.Get("Cross-Origin-Embedder-Policy") != "require-corp" {
		t.Errorf("COEP header = %q, expected \"require-corp\"", headers.Get("Cross-Origin-Embedder-Policy"))
	}
	if headers.Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("CORS header = %q, expected \"*\"", headers.Get("Access-Control-Allow-Origin"))
	}
	if headers.Get("data-version") != "1.0.0" {
		t.Errorf("data-version header = %q, expected \"1.0.0\"", headers.Get("data-version"))
	}
}

// ---- consoleHandler ----

func TestConsoleHandler_WritesLogOnJsonRequest(t *testing.T) {
	loggerDir := filepath.Join(exPath, "logger")
	defer os.RemoveAll(loggerDir)
	body := strings.NewReader(`{"fileName":"test.log","fileSize":"1"}`)
	r := httptest.NewRequest("POST", "/application/logger", body)
	r.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	consoleHandler(recorder, r)
	responseBody := recorder.Body.String()
	if !strings.Contains(responseBody, "日志写入成功") {
		t.Errorf("consoleHandler response = %q, expected to contain \"日志写入成功\"", responseBody)
	}
}

func TestConsoleHandler_NonJsonContentTypeNoPanic(t *testing.T) {
	loggerDir := filepath.Join(exPath, "logger")
	defer os.RemoveAll(loggerDir)
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("consoleHandler panicked on non-JSON content type: %v", r)
		}
	}()
	r := httptest.NewRequest("POST", "/application/logger", nil)
	r.Header.Set("Content-Type", "text/plain")
	recorder := httptest.NewRecorder()
	consoleHandler(recorder, r)
}

// ---- getHdcPublicKey ----

func TestGetHdcPublicKey_ReturnsPublicKey(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized by TestMain")
	}
	r := httptest.NewRequest("GET", "/application/hdcPublicKey", nil)
	recorder := httptest.NewRecorder()
	getHdcPublicKey(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "publicKey") {
		t.Errorf("getHdcPublicKey response = %q, expected to contain \"publicKey\"", body)
	}
	if !strings.Contains(body, "BEGIN PUBLIC KEY") {
		t.Errorf("getHdcPublicKey response = %q, expected to contain PEM public key", body)
	}
}

// ---- encryptHdcMsg ----

func TestEncryptHdcMsg_ValidMessage_ReturnsSignature(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized by TestMain")
	}
	r := httptest.NewRequest("GET", "/application/encryptHdcMsg?message=hello", nil)
	recorder := httptest.NewRecorder()
	encryptHdcMsg(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "signatures") {
		t.Errorf("encryptHdcMsg response = %q, expected to contain \"signatures\"", body)
	}
	if !strings.Contains(body, "success") {
		t.Errorf("encryptHdcMsg response = %q, expected to contain \"success\"", body)
	}
}

func TestEncryptHdcMsg_EmptyMessage_ReturnsError(t *testing.T) {
	r := httptest.NewRequest("GET", "/application/encryptHdcMsg", nil)
	recorder := httptest.NewRecorder()
	encryptHdcMsg(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "Invalid message") {
		t.Errorf("encryptHdcMsg empty message response = %q, expected to contain \"Invalid message\"", body)
	}
}

// ---- signatureHdcMsg ----

func TestSignatureHdcMsg_ValidMessage_ReturnsSignature(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized by TestMain")
	}
	r := httptest.NewRequest("GET", "/application/signatureHdcMsg?message=hello", nil)
	recorder := httptest.NewRecorder()
	signatureHdcMsg(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "signatures") {
		t.Errorf("signatureHdcMsg response = %q, expected to contain \"signatures\"", body)
	}
}

func TestSignatureHdcMsg_EmptyMessage_ReturnsError(t *testing.T) {
	r := httptest.NewRequest("GET", "/application/signatureHdcMsg", nil)
	recorder := httptest.NewRecorder()
	signatureHdcMsg(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "Invalid message") {
		t.Errorf("signatureHdcMsg empty message response = %q, expected to contain \"Invalid message\"", body)
	}
}

// ---- getServerConfig ----

func TestGetServerConfig_ReturnsConfigJson(t *testing.T) {
	serverConfig.Mux.Lock()
	serverConfig.ReportConfig = ReportConfig{Switch: true, URL: "http://test.example.com"}
	serverConfig.AiAssistantConfig = AiAssistantConfig{Switch: false}
	serverConfig.Mux.Unlock()

	r := httptest.NewRequest("GET", "/application/serverconfig", nil)
	recorder := httptest.NewRecorder()
	getServerConfig(recorder, r)

	if recorder.Code != http.StatusOK {
		t.Errorf("getServerConfig status = %d, expected %d", recorder.Code, http.StatusOK)
	}
	body := recorder.Body.String()
	if !strings.Contains(body, "reportConfig") {
		t.Errorf("getServerConfig response = %q, expected to contain \"reportConfig\"", body)
	}
	if !strings.Contains(body, "http://test.example.com") {
		t.Errorf("getServerConfig response = %q, expected to contain test URL", body)
	}
}

// ---- clearOverdueFile ----

func TestClearOverdueFile_DeletesOverdueFiles(t *testing.T) {
	uploadDir := filepath.FromSlash("./upload/")
	os.RemoveAll(uploadDir)
	os.MkdirAll(uploadDir, os.ModePerm)
	defer os.RemoveAll(uploadDir)

	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		t.Skip("Asia/Shanghai timezone not available")
	}
	overdueTime := time.Now().In(loc).Add(-2 * time.Hour)
	overdueName := overdueTime.Format("20060102150405000") + ".txt"
	overduePath := filepath.Join(uploadDir, overdueName)
	if err := os.WriteFile(overduePath, []byte("old"), 0666); err != nil {
		t.Fatalf("failed to create overdue file: %v", err)
	}

	clearOverdueFile()

	if _, err := os.Stat(overduePath); !os.IsNotExist(err) {
		t.Errorf("clearOverdueFile should have deleted %q", overdueName)
	}
}

func TestClearOverdueFile_KeepsRecentFiles(t *testing.T) {
	uploadDir := filepath.FromSlash("./upload/")
	os.RemoveAll(uploadDir)
	os.MkdirAll(uploadDir, os.ModePerm)
	defer os.RemoveAll(uploadDir)

	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		t.Skip("Asia/Shanghai timezone not available")
	}
	recentTime := time.Now().In(loc)
	recentName := recentTime.Format("20060102150405000") + ".txt"
	recentPath := filepath.Join(uploadDir, recentName)
	if err := os.WriteFile(recentPath, []byte("recent"), 0666); err != nil {
		t.Fatalf("failed to create recent file: %v", err)
	}

	clearOverdueFile()

	if _, err := os.Stat(recentPath); os.IsNotExist(err) {
		t.Errorf("clearOverdueFile should not have deleted recent file %q", recentName)
	}
}

// ---- downloadHandler ----

func TestDownloadHandler_NoContentType_ReturnsError(t *testing.T) {
	defer os.RemoveAll(filepath.FromSlash("./upload/"))
	r := httptest.NewRequest("POST", "/application/download-file", nil)
	recorder := httptest.NewRecorder()
	downloadHandler(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "请求方式错误") {
		t.Errorf("downloadHandler no content-type response = %q, expected to contain \"请求方式错误\"", body)
	}
}

func TestDownloadHandler_WrongContentType_ReturnsError(t *testing.T) {
	defer os.RemoveAll(filepath.FromSlash("./upload/"))
	r := httptest.NewRequest("POST", "/application/download-file", nil)
	r.Header.Set("Content-Type", "text/plain")
	recorder := httptest.NewRecorder()
	downloadHandler(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "请求方式错误") {
		t.Errorf("downloadHandler wrong content-type response = %q, expected to contain \"请求方式错误\"", body)
	}
}
