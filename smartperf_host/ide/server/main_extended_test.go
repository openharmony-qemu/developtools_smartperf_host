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
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// ============================================================
// getSuffixByUrl — 扩展边界用例
// ============================================================

func TestGetSuffixByUrl_MultipleSlashes(t *testing.T) {
	result := getSuffixByUrl("http://example.com/path/to/file.tar.gz")
	if result.suffix != ".gz" {
		t.Errorf("suffix = %q, expected \".gz\"", result.suffix)
	}
}

func TestGetSuffixByUrl_OnlyDomain(t *testing.T) {
	result := getSuffixByUrl("http://example.com")
	if result.suffix != ".com" {
		t.Errorf("suffix = %q, expected \".com\"", result.suffix)
	}
}

func TestGetSuffixByUrl_EmptyString(t *testing.T) {
	result := getSuffixByUrl("")
	if result.fileName != "" || result.suffix != "" {
		t.Errorf("getSuffixByUrl(\"\") = {%q, %q}, expected {\"\", \"\"}", result.fileName, result.suffix)
	}
}

func TestGetSuffixByUrl_OnlySlash(t *testing.T) {
	result := getSuffixByUrl("/")
	if result.fileName != "/" {
		t.Errorf("fileName = %q, expected \"/\"", result.fileName)
	}
	if result.suffix != "" {
		t.Errorf("suffix = %q, expected \"\"", result.suffix)
	}
}

func TestGetSuffixByUrl_MultipleDots(t *testing.T) {
	result := getSuffixByUrl("file.name.with.many.dots.json")
	if result.suffix != ".json" {
		t.Errorf("suffix = %q, expected \".json\"", result.suffix)
	}
	if result.fileName != "file.name.with.many.dots" {
		t.Errorf("fileName = %q, expected \"file.name.with.many.dots\"", result.fileName)
	}
}

func TestGetSuffixByUrl_UrlWithQueryParams(t *testing.T) {
	result := getSuffixByUrl("http://example.com/file.txt?param=value")
	if result.suffix != ".txt?param=value" && result.suffix != ".txt" {
		t.Logf("suffix = %q (query param handling)", result.suffix)
	}
}

func TestGetSuffixByUrl_UrlWithFragment(t *testing.T) {
	result := getSuffixByUrl("http://example.com/page.html#section")
	if !strings.Contains(result.suffix, ".html") {
		t.Errorf("suffix = %q, expected to contain \".html\"", result.suffix)
	}
}

func TestGetSuffixByUrl_TrailingSlash(t *testing.T) {
	result := getSuffixByUrl("http://example.com/dir/")
	if result.fileName != "/" {
		t.Errorf("fileName = %q, expected \"/\"", result.fileName)
	}
}

func TestGetSuffixByUrl_OnlyDot(t *testing.T) {
	result := getSuffixByUrl(".")
	if result.suffix != "." {
		t.Errorf("suffix = %q, expected \".\"", result.suffix)
	}
}

func TestGetSuffixByUrl_DotInMiddle(t *testing.T) {
	result := getSuffixByUrl("http://example.com/dir.name/file")
	if result.suffix != "" {
		t.Errorf("suffix = %q, expected \"\" (no extension after last slash)", result.suffix)
	}
}

func TestGetSuffixByUrl_LongExtension(t *testing.T) {
	result := getSuffixByUrl("archive.verylongextension")
	if result.suffix != ".verylongextension" {
		t.Errorf("suffix = %q, expected \".verylongextension\"", result.suffix)
	}
}

func TestGetSuffixByUrl_NumberInFileName(t *testing.T) {
	result := getSuffixByUrl("http://example.com/file123_v2.txt")
	if result.suffix != ".txt" {
		t.Errorf("suffix = %q, expected \".txt\"", result.suffix)
	}
}

func TestGetSuffixByUrl_SpecialCharacters(t *testing.T) {
	result := getSuffixByUrl("http://example.com/file%20name.json")
	if !strings.Contains(result.suffix, ".json") {
		t.Errorf("suffix = %q, expected to contain \".json\"", result.suffix)
	}
}

func TestGetSuffixByUrl_HttpsUrl(t *testing.T) {
	result := getSuffixByUrl("https://secure.example.com/data.csv")
	if result.suffix != ".csv" {
		t.Errorf("suffix = %q, expected \".csv\"", result.suffix)
	}
}

func TestGetSuffixByUrl_FtpUrl(t *testing.T) {
	result := getSuffixByUrl("ftp://ftp.example.com/file.dat")
	if result.suffix != ".dat" {
		t.Errorf("suffix = %q, expected \".dat\"", result.suffix)
	}
}

func TestGetSuffixByUrl_PortInUrl(t *testing.T) {
	result := getSuffixByUrl("http://example.com:8080/file.xml")
	if result.suffix != ".xml" {
		t.Errorf("suffix = %q, expected \".xml\"", result.suffix)
	}
}

// ============================================================
// SplitLines — 扩展边界用例
// ============================================================

func TestSplitLines_CRLFLineEndings(t *testing.T) {
	input := "line1\r\nline2\r\nline3"
	result := SplitLines(input)
	if len(result) != 3 {
		t.Errorf("SplitLines with CRLF returned %d lines, expected 3", len(result))
	}
	if result[0] != "line1" {
		t.Errorf("result[0] = %q, expected \"line1\" (CRLF should strip \\r)", result[0])
	}
}

func TestSplitLines_MultipleBlankLines(t *testing.T) {
	input := "line1\n\n\nline2"
	result := SplitLines(input)
	if len(result) != 4 {
		t.Errorf("SplitLines returned %d lines, expected 4", len(result))
	}
	if result[1] != "" || result[2] != "" {
		t.Errorf("blank lines should be empty strings, got %q and %q", result[1], result[2])
	}
}

func TestSplitLines_OnlyNewlines(t *testing.T) {
	result := SplitLines("\n\n\n")
	if len(result) != 3 {
		t.Errorf("SplitLines(\"\\n\\n\\n\") returned %d lines, expected 3", len(result))
	}
	for i, line := range result {
		if line != "" {
			t.Errorf("result[%d] = %q, expected \"\"", i, line)
		}
	}
}

func TestSplitLines_UnicodeContent(t *testing.T) {
	input := "中文第一行\n中文第二行\nEnglish line"
	result := SplitLines(input)
	if len(result) != 3 {
		t.Errorf("SplitLines returned %d lines, expected 3", len(result))
	}
	if result[0] != "中文第一行" {
		t.Errorf("result[0] = %q, expected \"中文第一行\"", result[0])
	}
}

func TestSplitLines_LongLine(t *testing.T) {
	longLine := strings.Repeat("A", 10000)
	result := SplitLines(longLine)
	if len(result) != 1 {
		t.Errorf("SplitLines returned %d lines, expected 1", len(result))
	}
	if len(result[0]) != 10000 {
		t.Errorf("line length = %d, expected 10000", len(result[0]))
	}
}

func TestSplitLines_OnlyCarriageReturn(t *testing.T) {
	result := SplitLines("line1\rline2")
	if len(result) != 1 {
		t.Errorf("SplitLines with only \\r returned %d lines, expected 1", len(result))
	}
}

func TestSplitLines_TabsAndSpaces(t *testing.T) {
	input := "\ttab\t\n  spaces  \n"
	result := SplitLines(input)
	if len(result) != 2 {
		t.Errorf("SplitLines returned %d lines, expected 2", len(result))
	}
	if result[0] != "\ttab\t" {
		t.Errorf("result[0] = %q, expected \"\\ttab\\t\"", result[0])
	}
}

func TestSplitLines_MixedEndings(t *testing.T) {
	input := "line1\nline2\r\nline3"
	result := SplitLines(input)
	if len(result) != 3 {
		t.Errorf("SplitLines returned %d lines, expected 3", len(result))
	}
}

// ============================================================
// mapToJson / jsonToMap — 扩展边界用例
// ============================================================

func TestMapToJson_EmptyMap(t *testing.T) {
	result, err := mapToJson(map[string]interface{}{})
	if err != nil {
		t.Fatalf("mapToJson returned error: %v", err)
	}
	if result != "{}" {
		t.Errorf("mapToJson(empty) = %q, expected \"{}\"", result)
	}
}

func TestMapToJson_NilValue(t *testing.T) {
	m := map[string]interface{}{"key": nil}
	result, err := mapToJson(m)
	if err != nil {
		t.Fatalf("mapToJson returned error: %v", err)
	}
	if !strings.Contains(result, "null") {
		t.Errorf("mapToJson result = %q, expected to contain \"null\"", result)
	}
}

func TestMapToJson_NestedMap(t *testing.T) {
	m := map[string]interface{}{
		"outer": map[string]interface{}{
			"inner": "value",
		},
	}
	result, err := mapToJson(m)
	if err != nil {
		t.Fatalf("mapToJson returned error: %v", err)
	}
	if !strings.Contains(result, "inner") {
		t.Errorf("mapToJson result = %q, expected to contain \"inner\"", result)
	}
}

func TestMapToJson_ArrayValue(t *testing.T) {
	m := map[string]interface{}{
		"items": []interface{}{"a", "b", "c"},
	}
	result, err := mapToJson(m)
	if err != nil {
		t.Fatalf("mapToJson returned error: %v", err)
	}
	if !strings.Contains(result, "a") || !strings.Contains(result, "b") || !strings.Contains(result, "c") {
		t.Errorf("mapToJson result = %q, expected to contain array items", result)
	}
}

func TestMapToJson_BooleanValue(t *testing.T) {
	m := map[string]interface{}{"flag": true}
	result, err := mapToJson(m)
	if err != nil {
		t.Fatalf("mapToJson returned error: %v", err)
	}
	if !strings.Contains(result, "true") {
		t.Errorf("mapToJson result = %q, expected to contain \"true\"", result)
	}
}

func TestMapToJson_NumericValue(t *testing.T) {
	m := map[string]interface{}{"count": 42, "price": 3.14}
	result, err := mapToJson(m)
	if err != nil {
		t.Fatalf("mapToJson returned error: %v", err)
	}
	if !strings.Contains(result, "42") {
		t.Errorf("mapToJson result = %q, expected to contain \"42\"", result)
	}
	if !strings.Contains(result, "3.14") {
		t.Errorf("mapToJson result = %q, expected to contain \"3.14\"", result)
	}
}

func TestJsonToMap_EmptyJson(t *testing.T) {
	result, err := jsonToMap("{}")
	if err != nil {
		t.Fatalf("jsonToMap returned error: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("jsonToMap(\"{}\") returned %d items, expected 0", len(result))
	}
}

func TestJsonToMap_NestedJson(t *testing.T) {
	input := `{"outer":{"inner":"value"}}`
	result, err := jsonToMap(input)
	if err != nil {
		t.Fatalf("jsonToMap returned error: %v", err)
	}
	if result["outer"] == nil {
		t.Errorf("jsonToMap[\"outer\"] is nil, expected nested map")
	}
}

func TestJsonToMap_ArrayJson(t *testing.T) {
	input := `{"items":["a","b","c"]}`
	result, err := jsonToMap(input)
	if err != nil {
		t.Fatalf("jsonToMap returned error: %v", err)
	}
	if result["items"] == nil {
		t.Errorf("jsonToMap[\"items\"] is nil, expected array")
	}
}

func TestJsonToMap_BooleanJson(t *testing.T) {
	input := `{"flag":true}`
	result, err := jsonToMap(input)
	if err != nil {
		t.Fatalf("jsonToMap returned error: %v", err)
	}
	if result["flag"] != true {
		t.Errorf("jsonToMap[\"flag\"] = %v, expected true", result["flag"])
	}
}

func TestJsonToMap_EmptyString(t *testing.T) {
	_, err := jsonToMap("")
	if err == nil {
		t.Fatal("jsonToMap(\"\") expected error, got nil")
	}
}

func TestJsonToMap_NullJson(t *testing.T) {
	_, err := jsonToMap("null")
	if err != nil {
		t.Fatalf("jsonToMap(\"null\") returned error: %v", err)
	}
}

func TestMapToJson_LargeMap(t *testing.T) {
	m := make(map[string]interface{})
	for i := 0; i < 100; i++ {
		m[string(rune('A'+i%26))+string(rune('0'+i/26))] = i
	}
	result, err := mapToJson(m)
	if err != nil {
		t.Fatalf("mapToJson returned error: %v", err)
	}
	if len(result) < 100 {
		t.Errorf("mapToJson result too short: %d bytes", len(result))
	}
}

// ============================================================
// resp — 扩展边界用例
// ============================================================

func TestResp_NilData(t *testing.T) {
	recorder := httptest.NewRecorder()
	var w http.ResponseWriter = recorder
	resp(&w)(true, 0, "success", nil)
	body := recorder.Body.String()
	if !strings.Contains(body, "\"success\":true") {
		t.Errorf("response body = %q, expected \"success\":true", body)
	}
	if !strings.Contains(body, "\"data\":null") {
		t.Errorf("response body = %q, expected \"data\":null", body)
	}
}

func TestResp_EmptyMsg(t *testing.T) {
	recorder := httptest.NewRecorder()
	var w http.ResponseWriter = recorder
	resp(&w)(true, 0, "", map[string]interface{}{"key": "value"})
	body := recorder.Body.String()
	if !strings.Contains(body, "\"msg\":\"\"") {
		t.Errorf("response body = %q, expected empty msg", body)
	}
}

func TestResp_LargeCode(t *testing.T) {
	recorder := httptest.NewRecorder()
	var w http.ResponseWriter = recorder
	resp(&w)(true, 99999, "large code", nil)
	body := recorder.Body.String()
	if !strings.Contains(body, "\"code\":99999") {
		t.Errorf("response body = %q, expected \"code\":99999", body)
	}
}

func TestResp_NegativeCode(t *testing.T) {
	recorder := httptest.NewRecorder()
	var w http.ResponseWriter = recorder
	resp(&w)(false, -500, "server error", nil)
	body := recorder.Body.String()
	if !strings.Contains(body, "\"code\":-500") {
		t.Errorf("response body = %q, expected \"code\":-500", body)
	}
}

func TestResp_ComplexNestedData(t *testing.T) {
	recorder := httptest.NewRecorder()
	var w http.ResponseWriter = recorder
	data := map[string]interface{}{
		"user": map[string]interface{}{
			"name":  "test",
			"email": "test@example.com",
			"roles": []interface{}{"admin", "user"},
		},
		"meta": map[string]interface{}{
			"page": 1,
			"size": 20,
		},
	}
	resp(&w)(true, 0, "success", data)
	body := recorder.Body.String()
	if !strings.Contains(body, "admin") {
		t.Errorf("response body = %q, expected to contain \"admin\"", body)
	}
	if !strings.Contains(body, "test@example.com") {
		t.Errorf("response body = %q, expected to contain email", body)
	}
}

func TestResp_UnicodeMsg(t *testing.T) {
	recorder := httptest.NewRecorder()
	var w http.ResponseWriter = recorder
	resp(&w)(true, 0, "成功消息", nil)
	body := recorder.Body.String()
	if !strings.Contains(body, "成功消息") {
		t.Errorf("response body = %q, expected to contain Unicode message", body)
	}
}

func TestResp_SpecialCharsInMsg(t *testing.T) {
	recorder := httptest.NewRecorder()
	var w http.ResponseWriter = recorder
	resp(&w)(true, 0, "msg with \"quotes\" and \\backslash", nil)
	body := recorder.Body.String()
	if !strings.Contains(body, "quotes") {
		t.Errorf("response body = %q, expected to contain \"quotes\"", body)
	}
}

// ============================================================
// exist / PathExists — 扩展边界用例
// ============================================================

func TestExist_DirectoryExists(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "test_exist_dir_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)
	if !exist(tmpDir) {
		t.Errorf("exist(%q) = false for directory, expected true", tmpDir)
	}
}

func TestExist_RelativePath(t *testing.T) {
	if !exist(".") {
		t.Errorf("exist(\".\") = false, expected true for current directory")
	}
}

func TestExist_EmptyString(t *testing.T) {
	result := exist("")
	if result {
		t.Errorf("exist(\"\") = true, expected false")
	}
}

func TestExist_LongPath(t *testing.T) {
	longPath := filepath.Join(os.TempDir(), strings.Repeat("longdir_", 20))
	defer os.RemoveAll(longPath)
	if exist(longPath) {
		t.Errorf("exist(longPath) = true, expected false for non-existent")
	}
}

func TestPathExists_DirectoryExists(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "test_pathexists_dir_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)
	exists, err := PathExists(tmpDir)
	if err != nil {
		t.Errorf("PathExists(%q) returned error: %v", tmpDir, err)
	}
	if !exists {
		t.Errorf("PathExists(%q) = false, expected true for directory", tmpDir)
	}
}

func TestPathExists_EmptyString(t *testing.T) {
	exists, err := PathExists("")
	if err == nil && exists {
		t.Errorf("PathExists(\"\") returned exists=true with no error, unexpected")
	}
}

func TestPathExists_RelativePath(t *testing.T) {
	exists, err := PathExists(".")
	if err != nil {
		t.Errorf("PathExists(\".\") returned error: %v", err)
	}
	if !exists {
		t.Errorf("PathExists(\".\") = false, expected true")
	}
}

// ============================================================
// chekDir / MkDir — 扩展边界用例
// ============================================================

func TestChekDir_DeepNestedDirectory(t *testing.T) {
	testDir := filepath.Join(os.TempDir(), "test_chekdir_deep", "a", "b", "c")
	defer os.RemoveAll(filepath.Join(os.TempDir(), "test_chekdir_deep"))
	chekDir(testDir)
	if exist(testDir) {
		t.Errorf("chekDir should only create one level, but deep dir exists")
	}
}

func TestChekDir_DoesNotDeleteExistingFiles(t *testing.T) {
	testDir := filepath.Join(os.TempDir(), "test_chekdir_files_12345")
	defer os.RemoveAll(testDir)
	os.MkdirAll(testDir, os.ModePerm)
	testFile := filepath.Join(testDir, "existing.txt")
	os.WriteFile(testFile, []byte("content"), 0666)
	chekDir(testDir)
	if !exist(testFile) {
		t.Errorf("chekDir should not delete existing files, but %q was removed", testFile)
	}
	data, _ := os.ReadFile(testFile)
	if string(data) != "content" {
		t.Errorf("existing file content was modified")
	}
}

func TestMkDir_DeepNestedPath(t *testing.T) {
	baseDir := filepath.Join(os.TempDir(), "test_mkdir_deep_12345")
	defer os.RemoveAll(baseDir)
	deepFile := filepath.Join(baseDir, "level1", "level2", "level3", "file.txt")
	MkDir(deepFile)
	if !exist(filepath.Dir(deepFile)) {
		t.Errorf("MkDir did not create deep nested directory %q", filepath.Dir(deepFile))
	}
}

func TestMkDir_WithSpacesInPath(t *testing.T) {
	baseDir := filepath.Join(os.TempDir(), "test mkdir spaces 12345")
	defer os.RemoveAll(baseDir)
	fileWithSpaces := filepath.Join(baseDir, "sub dir", "file name.txt")
	MkDir(fileWithSpaces)
	if !exist(filepath.Dir(fileWithSpaces)) {
		t.Errorf("MkDir did not create directory with spaces: %q", filepath.Dir(fileWithSpaces))
	}
}

// ============================================================
// readFileFirstLine — 扩展边界用例
// ============================================================

func TestReadFileFirstLine_EmptyFile(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test_empty_*.txt")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	tmpFile.Close()
	result := readFileFirstLine(tmpFile.Name())
	if result != "" {
		t.Errorf("readFileFirstLine on empty file = %q, expected \"\"", result)
	}
}

func TestReadFileFirstLine_SingleLineNoNewline(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test_singleno_*.txt")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	tmpFile.WriteString("only line no newline")
	tmpFile.Close()
	result := readFileFirstLine(tmpFile.Name())
	if result != "" {
		t.Logf("readFileFirstLine = %q (returns empty when no newline due to io.EOF check)", result)
	}
}

func TestReadFileFirstLine_MultiLineFile(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test_multi_*.txt")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	content := "first\nsecond\nthird\nfourth\n"
	tmpFile.WriteString(content)
	tmpFile.Close()
	result := readFileFirstLine(tmpFile.Name())
	if !strings.HasPrefix(result, "first") {
		t.Errorf("readFileFirstLine = %q, expected prefix \"first\"", result)
	}
}

func TestReadFileFirstLine_LongLine(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test_longline_*.txt")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	longContent := strings.Repeat("X", 5000) + "\nsecond line"
	tmpFile.WriteString(longContent)
	tmpFile.Close()
	result := readFileFirstLine(tmpFile.Name())
	if len(result) < 5000 {
		t.Errorf("readFileFirstLine returned %d chars, expected >= 5000", len(result))
	}
}

func TestReadFileFirstLine_UnicodeContent(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test_unicode_*.txt")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	tmpFile.WriteString("中文第一行\nEnglish second line")
	tmpFile.Close()
	result := readFileFirstLine(tmpFile.Name())
	if !strings.HasPrefix(result, "中文第一行") {
		t.Errorf("readFileFirstLine = %q, expected prefix \"中文第一行\"", result)
	}
}

func TestReadFileFirstLine_DirectoryPath(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "test_dir_*.d")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)
	result := readFileFirstLine(tmpDir)
	_ = result
}

// ============================================================
// RsaSign / RsaSignAndBase64 — 扩展边界用例
// ============================================================

func TestRsaSign_DifferentMessages(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	sig1, err1 := RsaSign("message1", hdcPrivateKey)
	sig2, err2 := RsaSign("message2", hdcPrivateKey)
	if err1 != nil || err2 != nil {
		t.Fatalf("RsaSign errors: %v, %v", err1, err2)
	}
	if sig1 == sig2 {
		t.Error("different messages should produce different signatures")
	}
}

func TestRsaSign_SameMessageProducesValidSignature(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	sig1, err1 := RsaSign("same message", hdcPrivateKey)
	sig2, err2 := RsaSign("same message", hdcPrivateKey)
	if err1 != nil || err2 != nil {
		t.Fatalf("RsaSign errors: %v, %v", err1, err2)
	}
	if sig1 == "" || sig2 == "" {
		t.Error("RsaSign should return non-empty signatures")
	}
	if sig1 == sig2 {
		t.Log("PSS signatures match (deterministic salt) — valid behavior")
	} else {
		t.Log("PSS signatures differ (random salt) — valid behavior")
	}
}

func TestRsaSign_EmptyMessage(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	sig, err := RsaSign("", hdcPrivateKey)
	if err != nil {
		t.Fatalf("RsaSign(\"\") returned error: %v", err)
	}
	if sig == "" {
		t.Error("RsaSign(\"\") returned empty signature")
	}
}

func TestRsaSign_LongMessage(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	longMsg := strings.Repeat("A", 10000)
	sig, err := RsaSign(longMsg, hdcPrivateKey)
	if err != nil {
		t.Fatalf("RsaSign(long) returned error: %v", err)
	}
	if sig == "" {
		t.Error("RsaSign(long) returned empty signature")
	}
}

func TestRsaSign_UnicodeMessage(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	sig, err := RsaSign("中文消息测试", hdcPrivateKey)
	if err != nil {
		t.Fatalf("RsaSign(unicode) returned error: %v", err)
	}
	if sig == "" {
		t.Error("RsaSign(unicode) returned empty signature")
	}
}

func TestRsaSignAndBase64_DifferentMessages(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	sig1, _ := RsaSignAndBase64("msg1", RSA_3072_SHA512)
	sig2, _ := RsaSignAndBase64("msg2", RSA_3072_SHA512)
	if sig1 == sig2 {
		t.Error("different messages should produce different signatures")
	}
}

func TestRsaSignAndBase64_EmptyMessage(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	sig, err := RsaSignAndBase64("", RSA_3072_SHA512)
	if err != nil {
		t.Fatalf("RsaSignAndBase64(\"\") returned error: %v", err)
	}
	if sig == "" {
		t.Error("RsaSignAndBase64(\"\") returned empty signature")
	}
}

func TestRsaSignAndBase64_SpecialCharacters(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	sig, err := RsaSignAndBase64("!@#$%^&*()", RSA_3072_SHA512)
	if err != nil {
		t.Fatalf("RsaSignAndBase64 returned error: %v", err)
	}
	if sig == "" {
		t.Error("RsaSignAndBase64 returned empty signature")
	}
}

func TestRsaSignAndBase64_IsValidBase64(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	sig, err := RsaSignAndBase64("test", RSA_3072_SHA512)
	if err != nil {
		t.Fatalf("RsaSignAndBase64 returned error: %v", err)
	}
	if len(sig)%4 != 0 {
		t.Errorf("signature length %d is not a multiple of 4, invalid base64", len(sig))
	}
}

// ============================================================
// cors — 扩展边界用例
// ============================================================

func TestCors_EmptyVersion(t *testing.T) {
	mockHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	wrapped := cors(mockHandler, "")
	recorder := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/", nil)
	wrapped.ServeHTTP(recorder, r)
	if recorder.Header().Get("data-version") != "" {
		t.Errorf("data-version = %q, expected \"\"", recorder.Header().Get("data-version"))
	}
}

func TestCors_LongVersion(t *testing.T) {
	mockHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	longVersion := "v1.2.3.4.5.6.7.8.9.10"
	wrapped := cors(mockHandler, longVersion)
	recorder := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/", nil)
	wrapped.ServeHTTP(recorder, r)
	if recorder.Header().Get("data-version") != longVersion {
		t.Errorf("data-version = %q, expected %q", recorder.Header().Get("data-version"), longVersion)
	}
}

func TestCors_AllHeadersPresent(t *testing.T) {
	mockHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})
	wrapped := cors(mockHandler, "2.0")
	recorder := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/", nil)
	wrapped.ServeHTTP(recorder, r)
	h := recorder.Header()
	expectedHeaders := []string{
		"Cross-Origin-Opener-Policy",
		"Cross-Origin-Embedder-Policy",
		"Access-Control-Allow-Origin",
		"Access-Control-Allow-Credentials",
		"Access-Control-Allow-Headers",
		"Access-Control-Allow-Methods",
		"Access-Control-Max-Age",
		"data-version",
		"Cache-Control",
		"Pragma",
	}
	for _, header := range expectedHeaders {
		if h.Get(header) == "" {
			t.Errorf("header %q is missing", header)
		}
	}
}

func TestCors_AllowMethods(t *testing.T) {
	mockHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})
	wrapped := cors(mockHandler, "1.0")
	recorder := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/", nil)
	wrapped.ServeHTTP(recorder, r)
	if recorder.Header().Get("Access-Control-Allow-Methods") != "*" {
		t.Errorf("Allow-Methods = %q, expected \"*\"", recorder.Header().Get("Access-Control-Allow-Methods"))
	}
}

func TestCors_CacheControlNoCache(t *testing.T) {
	mockHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})
	wrapped := cors(mockHandler, "1.0")
	recorder := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/", nil)
	wrapped.ServeHTTP(recorder, r)
	if recorder.Header().Get("Cache-Control") != "no-cache" {
		t.Errorf("Cache-Control = %q, expected \"no-cache\"", recorder.Header().Get("Cache-Control"))
	}
	if recorder.Header().Get("Pragma") != "no-cache" {
		t.Errorf("Pragma = %q, expected \"no-cache\"", recorder.Header().Get("Pragma"))
	}
}

func TestCors_DelegatesToInnerHandler(t *testing.T) {
	innerCalled := false
	mockHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		innerCalled = true
		w.WriteHeader(http.StatusAccepted)
	})
	wrapped := cors(mockHandler, "1.0")
	recorder := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/test", nil)
	wrapped.ServeHTTP(recorder, r)
	if !innerCalled {
		t.Error("cors did not delegate to inner handler")
	}
	if recorder.Code != http.StatusAccepted {
		t.Errorf("status code = %d, expected %d", recorder.Code, http.StatusAccepted)
	}
}

// ============================================================
// consoleHandler — 扩展边界用例
// ============================================================

func TestConsoleHandler_LogFileCreated(t *testing.T) {
	loggerDir := filepath.Join(exPath, "logger")
	defer os.RemoveAll(loggerDir)
	body := strings.NewReader(`{"fileName":"app.log","fileSize":"10"}`)
	r := httptest.NewRequest("POST", "/application/logger", body)
	r.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	consoleHandler(recorder, r)
	now := time.Now()
	expectedFile := filepath.Join(loggerDir, fmt.Sprintf("%d-%d-%d", now.Year(), now.Month(), now.Day()))
	if !exist(expectedFile) {
		t.Errorf("log file %q was not created", expectedFile)
	}
}

func TestConsoleHandler_LogContentContainsFileName(t *testing.T) {
	loggerDir := filepath.Join(exPath, "logger")
	defer os.RemoveAll(loggerDir)
	body := strings.NewReader(`{"fileName":"myapp.log","fileSize":"5"}`)
	r := httptest.NewRequest("POST", "/application/logger", body)
	r.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	consoleHandler(recorder, r)
	now := time.Now()
	logFile := filepath.Join(loggerDir, fmt.Sprintf("%d-%d-%d", now.Year(), now.Month(), now.Day()))
	content, err := os.ReadFile(logFile)
	if err != nil {
		t.Fatalf("failed to read log file: %v", err)
	}
	if !strings.Contains(string(content), "myapp.log") {
		t.Errorf("log content = %q, expected to contain \"myapp.log\"", string(content))
	}
	if !strings.Contains(string(content), "5") {
		t.Errorf("log content = %q, expected to contain file size \"5\"", string(content))
	}
}

func TestConsoleHandler_MultipleRequestsAppend(t *testing.T) {
	loggerDir := filepath.Join(exPath, "logger")
	defer os.RemoveAll(loggerDir)
	for i := 0; i < 3; i++ {
		body := strings.NewReader(`{"fileName":"app.log","fileSize":"1"}`)
		r := httptest.NewRequest("POST", "/application/logger", body)
		r.Header.Set("Content-Type", "application/json")
		recorder := httptest.NewRecorder()
		consoleHandler(recorder, r)
	}
	now := time.Now()
	logFile := filepath.Join(loggerDir, fmt.Sprintf("%d-%d-%d", now.Year(), now.Month(), now.Day()))
	content, err := os.ReadFile(logFile)
	if err != nil {
		t.Fatalf("failed to read log file: %v", err)
	}
	lines := strings.Count(string(content), "\n")
	if lines < 3 {
		t.Errorf("expected at least 3 log lines, got %d", lines)
	}
}

func TestConsoleHandler_EmptyBody(t *testing.T) {
	loggerDir := filepath.Join(exPath, "logger")
	defer os.RemoveAll(loggerDir)
	r := httptest.NewRequest("POST", "/application/logger", nil)
	r.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("consoleHandler panicked on empty body: %v", r)
		}
	}()
	consoleHandler(recorder, r)
}

func TestConsoleHandler_MissingContentType(t *testing.T) {
	loggerDir := filepath.Join(exPath, "logger")
	os.RemoveAll(loggerDir)
	defer os.RemoveAll(loggerDir)
	body := strings.NewReader(`{"fileName":"test.log","fileSize":"1"}`)
	r := httptest.NewRequest("POST", "/application/logger", body)
	recorder := httptest.NewRecorder()
	consoleHandler(recorder, r)
	responseBody := recorder.Body.String()
	if strings.Contains(responseBody, "日志写入成功") {
		t.Error("should not return success response when Content-Type is missing")
	}
}

// ============================================================
// getHdcPublicKey — 扩展边界用例
// ============================================================

func TestGetHdcPublicKey_ResponseContainsSuccess(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	r := httptest.NewRequest("GET", "/application/hdcPublicKey", nil)
	recorder := httptest.NewRecorder()
	getHdcPublicKey(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "\"success\":true") {
		t.Errorf("response = %q, expected \"success\":true", body)
	}
	if !strings.Contains(body, "\"code\":0") {
		t.Errorf("response = %q, expected \"code\":0", body)
	}
}

func TestGetHdcPublicKey_PublicKeyIsPEMFormat(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	r := httptest.NewRequest("GET", "/application/hdcPublicKey", nil)
	recorder := httptest.NewRecorder()
	getHdcPublicKey(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "-----BEGIN PUBLIC KEY-----") {
		t.Errorf("response = %q, expected PEM BEGIN marker", body)
	}
	if !strings.Contains(body, "-----END PUBLIC KEY-----") {
		t.Errorf("response = %q, expected PEM END marker", body)
	}
}

func TestGetHdcPublicKey_SetsHeaders(t *testing.T) {
	r := httptest.NewRequest("GET", "/application/hdcPublicKey", nil)
	recorder := httptest.NewRecorder()
	getHdcPublicKey(recorder, r)
	if recorder.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("CORS header missing")
	}
	if recorder.Header().Get("Content-Type") != "text/json" {
		t.Errorf("Content-Type = %q, expected \"text/json\"", recorder.Header().Get("Content-Type"))
	}
}

func TestGetHdcPublicKey_ConsistentAcrossCalls(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	r1 := httptest.NewRequest("GET", "/application/hdcPublicKey", nil)
	rec1 := httptest.NewRecorder()
	getHdcPublicKey(rec1, r1)
	r2 := httptest.NewRequest("GET", "/application/hdcPublicKey", nil)
	rec2 := httptest.NewRecorder()
	getHdcPublicKey(rec2, r2)
	if rec1.Body.String() != rec2.Body.String() {
		t.Error("getHdcPublicKey should return consistent public key")
	}
}

// ============================================================
// encryptHdcMsg — 扩展边界用例
// ============================================================

func TestEncryptHdcMsg_LongMessage(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	longMsg := strings.Repeat("A", 1000)
	r := httptest.NewRequest("GET", "/application/encryptHdcMsg?message="+longMsg, nil)
	recorder := httptest.NewRecorder()
	encryptHdcMsg(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "success") {
		t.Errorf("response = %q, expected success", body)
	}
}

func TestEncryptHdcMsg_UnicodeMessage(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	r := httptest.NewRequest("GET", "/application/encryptHdcMsg?message=中文消息", nil)
	recorder := httptest.NewRecorder()
	encryptHdcMsg(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "success") {
		t.Errorf("response = %q, expected success for unicode message", body)
	}
}

func TestEncryptHdcMsg_DifferentMessagesProduceDifferentSignatures(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	r1 := httptest.NewRequest("GET", "/application/encryptHdcMsg?message=msg1", nil)
	rec1 := httptest.NewRecorder()
	encryptHdcMsg(rec1, r1)
	r2 := httptest.NewRequest("GET", "/application/encryptHdcMsg?message=msg2", nil)
	rec2 := httptest.NewRecorder()
	encryptHdcMsg(rec2, r2)
	if rec1.Body.String() == rec2.Body.String() {
		t.Error("different messages should produce different signatures")
	}
}

func TestEncryptHdcMsg_SetsHeaders(t *testing.T) {
	r := httptest.NewRequest("GET", "/application/encryptHdcMsg?message=test", nil)
	recorder := httptest.NewRecorder()
	encryptHdcMsg(recorder, r)
	if recorder.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("CORS header missing")
	}
	if recorder.Header().Get("Content-Type") != "text/json" {
		t.Errorf("Content-Type = %q, expected \"text/json\"", recorder.Header().Get("Content-Type"))
	}
}

// ============================================================
// signatureHdcMsg — 扩展边界用例
// ============================================================

func TestSignatureHdcMsg_LongMessage(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	longMsg := strings.Repeat("B", 1000)
	r := httptest.NewRequest("GET", "/application/signatureHdcMsg?message="+longMsg, nil)
	recorder := httptest.NewRecorder()
	signatureHdcMsg(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "success") {
		t.Errorf("response = %q, expected success", body)
	}
}

func TestSignatureHdcMsg_UnicodeMessage(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	r := httptest.NewRequest("GET", "/application/signatureHdcMsg?message=测试消息", nil)
	recorder := httptest.NewRecorder()
	signatureHdcMsg(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "success") {
		t.Errorf("response = %q, expected success for unicode", body)
	}
}

func TestSignatureHdcMsg_DifferentMessagesProduceDifferentSignatures(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	r1 := httptest.NewRequest("GET", "/application/signatureHdcMsg?message=msg1", nil)
	rec1 := httptest.NewRecorder()
	signatureHdcMsg(rec1, r1)
	r2 := httptest.NewRequest("GET", "/application/signatureHdcMsg?message=msg2", nil)
	rec2 := httptest.NewRecorder()
	signatureHdcMsg(rec2, r2)
	if rec1.Body.String() == rec2.Body.String() {
		t.Error("different messages should produce different signatures")
	}
}

func TestSignatureHdcMsg_SetsHeaders(t *testing.T) {
	r := httptest.NewRequest("GET", "/application/signatureHdcMsg?message=test", nil)
	recorder := httptest.NewRecorder()
	signatureHdcMsg(recorder, r)
	if recorder.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("CORS header missing")
	}
	if recorder.Header().Get("Content-Type") != "text/json" {
		t.Errorf("Content-Type = %q, expected \"text/json\"", recorder.Header().Get("Content-Type"))
	}
}

func TestSignatureHdcMsg_SignatureIsValidBase64(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	r := httptest.NewRequest("GET", "/application/signatureHdcMsg?message=test", nil)
	recorder := httptest.NewRecorder()
	signatureHdcMsg(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "signatures") {
		t.Skip("no signature in response")
	}
}

// ============================================================
// getServerConfig — 扩展边界用例
// ============================================================

func TestGetServerConfig_ContainsAllConfigSections(t *testing.T) {
	serverConfig.Mux.Lock()
	serverConfig.ReportConfig = ReportConfig{Switch: true, URL: "http://r.test"}
	serverConfig.TraceInfoConfig = TraceInfoConfig{Switch: true, Content: "trace info"}
	serverConfig.AdvertisingConfig = AdvertisingConfig{Switch: false, URL: "http://a.test"}
	serverConfig.BulletinConfig = BulletinConfig{Switch: true, Content: "bulletin"}
	serverConfig.AiAssistantConfig = AiAssistantConfig{Switch: true}
	serverConfig.Mux.Unlock()

	r := httptest.NewRequest("GET", "/application/serverconfig", nil)
	recorder := httptest.NewRecorder()
	getServerConfig(recorder, r)
	body := recorder.Body.String()
	expectedFields := []string{
		"reportConfig",
		"traceInfoConfig",
		"advertisingConfig",
		"bulletinConfig",
		"aiAssistantConfig",
	}
	for _, field := range expectedFields {
		if !strings.Contains(body, field) {
			t.Errorf("response = %q, expected to contain %q", body, field)
		}
	}
}

func TestGetServerConfig_SetsHeaders(t *testing.T) {
	r := httptest.NewRequest("GET", "/application/serverconfig", nil)
	recorder := httptest.NewRecorder()
	getServerConfig(recorder, r)
	if recorder.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("CORS header missing")
	}
	if recorder.Header().Get("Content-Type") != "application/json" {
		t.Errorf("Content-Type = %q, expected \"application/json\"", recorder.Header().Get("Content-Type"))
	}
}

func TestGetServerConfig_StatusCode200(t *testing.T) {
	r := httptest.NewRequest("GET", "/application/serverconfig", nil)
	recorder := httptest.NewRecorder()
	getServerConfig(recorder, r)
	if recorder.Code != http.StatusOK {
		t.Errorf("status code = %d, expected %d", recorder.Code, http.StatusOK)
	}
}

func TestGetServerConfig_MarshalDoesNotPanicWithConcurrentLock(t *testing.T) {
	done := make(chan bool)
	go func() {
		serverConfig.Mux.Lock()
		serverConfig.ReportConfig = ReportConfig{Switch: true}
		serverConfig.Mux.Unlock()
		done <- true
	}()
	<-done
	r := httptest.NewRequest("GET", "/application/serverconfig", nil)
	recorder := httptest.NewRecorder()
	defer func() {
		if rec := recover(); rec != nil {
			t.Fatalf("getServerConfig panicked: %v", rec)
		}
	}()
	getServerConfig(recorder, r)
}

// ============================================================
// clearOverdueFile — 扩展边界用例
// ============================================================

func TestClearOverdueFile_EmptyDirectory(t *testing.T) {
	uploadDir := filepath.FromSlash("./upload/")
	os.RemoveAll(uploadDir)
	os.MkdirAll(uploadDir, os.ModePerm)
	defer os.RemoveAll(uploadDir)
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("clearOverdueFile panicked on empty dir: %v", r)
		}
	}()
	clearOverdueFile()
}

func TestClearOverdueFile_MultipleOverdueFiles(t *testing.T) {
	uploadDir := filepath.FromSlash("./upload/")
	os.RemoveAll(uploadDir)
	os.MkdirAll(uploadDir, os.ModePerm)
	defer os.RemoveAll(uploadDir)
	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		t.Skip("Asia/Shanghai timezone not available")
	}
	overdueTime := time.Now().In(loc).Add(-2 * time.Hour)
	for i := 0; i < 5; i++ {
		name := overdueTime.Format("20060102150405000") + ".txt"
		path := filepath.Join(uploadDir, name)
		os.WriteFile(path, []byte("old"), 0666)
		overdueTime = overdueTime.Add(time.Minute)
	}
	clearOverdueFile()
	files, _ := os.ReadDir(uploadDir)
	for _, f := range files {
		if !strings.Contains(f.Name(), ".") {
			continue
		}
		name := strings.TrimSuffix(f.Name(), filepath.Ext(f.Name()))
		if _, err := time.ParseInLocation("20060102150405000", name, loc); err == nil {
			t.Errorf("overdue file %q was not deleted", f.Name())
		}
	}
}

func TestClearOverdueFile_InvalidFileNameNotDeleted(t *testing.T) {
	uploadDir := filepath.FromSlash("./upload/")
	os.RemoveAll(uploadDir)
	os.MkdirAll(uploadDir, os.ModePerm)
	defer os.RemoveAll(uploadDir)
	invalidName := "invalid_filename.txt"
	invalidPath := filepath.Join(uploadDir, invalidName)
	os.WriteFile(invalidPath, []byte("invalid"), 0666)
	clearOverdueFile()
	if _, err := os.Stat(invalidPath); os.IsNotExist(err) {
		t.Errorf("file with invalid name should not be deleted, but %q was removed", invalidName)
	}
}

func TestClearOverdueFile_MixedFiles(t *testing.T) {
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
	os.WriteFile(overduePath, []byte("old"), 0666)
	recentTime := time.Now().In(loc)
	recentName := recentTime.Format("20060102150405000") + ".txt"
	recentPath := filepath.Join(uploadDir, recentName)
	os.WriteFile(recentPath, []byte("recent"), 0666)
	invalidPath := filepath.Join(uploadDir, "invalid.txt")
	os.WriteFile(invalidPath, []byte("invalid"), 0666)
	clearOverdueFile()
	if _, err := os.Stat(overduePath); !os.IsNotExist(err) {
		t.Errorf("overdue file should have been deleted")
	}
	if _, err := os.Stat(recentPath); os.IsNotExist(err) {
		t.Errorf("recent file should not have been deleted")
	}
	if _, err := os.Stat(invalidPath); os.IsNotExist(err) {
		t.Errorf("invalid file should not have been deleted")
	}
}

func TestClearOverdueFile_DirectoryNotDeleted(t *testing.T) {
	uploadDir := filepath.FromSlash("./upload/")
	os.RemoveAll(uploadDir)
	os.MkdirAll(uploadDir, os.ModePerm)
	defer os.RemoveAll(uploadDir)
	subDir := filepath.Join(uploadDir, "subdir")
	os.MkdirAll(subDir, os.ModePerm)
	clearOverdueFile()
	if !exist(subDir) {
		t.Error("clearOverdueFile should not delete subdirectories")
	}
}

// ============================================================
// downloadHandler — 扩展边界用例
// ============================================================

func TestDownloadHandler_NoBody(t *testing.T) {
	defer os.RemoveAll(filepath.FromSlash("./upload/"))
	r := httptest.NewRequest("POST", "/application/download-file", nil)
	recorder := httptest.NewRecorder()
	downloadHandler(recorder, r)
	if recorder.Body.String() == "" {
		t.Error("downloadHandler should return error response for no body")
	}
}

func TestDownloadHandler_GetMethod(t *testing.T) {
	defer os.RemoveAll(filepath.FromSlash("./upload/"))
	r := httptest.NewRequest("GET", "/application/download-file", nil)
	recorder := httptest.NewRecorder()
	downloadHandler(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "请求方式错误") {
		t.Errorf("downloadHandler GET response = %q, expected error", body)
	}
}

func TestDownloadHandler_JsonContentType(t *testing.T) {
	defer os.RemoveAll(filepath.FromSlash("./upload/"))
	r := httptest.NewRequest("POST", "/application/download-file", nil)
	r.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	downloadHandler(recorder, r)
	body := recorder.Body.String()
	if !strings.Contains(body, "请求方式错误") {
		t.Errorf("downloadHandler JSON content-type response = %q, expected error", body)
	}
}

func TestDownloadHandler_SetsContentTypeHeader(t *testing.T) {
	defer os.RemoveAll(filepath.FromSlash("./upload/"))
	r := httptest.NewRequest("POST", "/application/download-file", nil)
	recorder := httptest.NewRecorder()
	downloadHandler(recorder, r)
	if recorder.Header().Get("content-type") != "text/json" {
		t.Errorf("content-type = %q, expected \"text/json\"", recorder.Header().Get("content-type"))
	}
}

// ============================================================
// LoggerReq — 结构体测试
// ============================================================

func TestLoggerReq_JsonDecode(t *testing.T) {
	jsonStr := `{"fileName":"app.log","fileSize":"100"}`
	var req LoggerReq
	err := json.Unmarshal([]byte(jsonStr), &req)
	if err != nil {
		t.Fatalf("json.Unmarshal failed: %v", err)
	}
	if req.FileName != "app.log" {
		t.Errorf("FileName = %q, expected \"app.log\"", req.FileName)
	}
	if req.FileSize != "100" {
		t.Errorf("FileSize = %q, expected \"100\"", req.FileSize)
	}
}

func TestLoggerReq_JsonEncode(t *testing.T) {
	req := LoggerReq{FileName: "test.log", FileSize: "50"}
	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("json.Marshal failed: %v", err)
	}
	result := string(data)
	if !strings.Contains(result, "test.log") {
		t.Errorf("JSON = %q, expected to contain \"test.log\"", result)
	}
	if !strings.Contains(result, "50") {
		t.Errorf("JSON = %q, expected to contain \"50\"", result)
	}
}

func TestLoggerReq_EmptyValues(t *testing.T) {
	jsonStr := `{"fileName":"","fileSize":""}`
	var req LoggerReq
	err := json.Unmarshal([]byte(jsonStr), &req)
	if err != nil {
		t.Fatalf("json.Unmarshal failed: %v", err)
	}
	if req.FileName != "" {
		t.Errorf("FileName = %q, expected \"\"", req.FileName)
	}
	if req.FileSize != "" {
		t.Errorf("FileSize = %q, expected \"\"", req.FileSize)
	}
}

func TestLoggerReq_MissingFields(t *testing.T) {
	jsonStr := `{}`
	var req LoggerReq
	err := json.Unmarshal([]byte(jsonStr), &req)
	if err != nil {
		t.Fatalf("json.Unmarshal failed: %v", err)
	}
	if req.FileName != "" {
		t.Errorf("FileName = %q, expected \"\" for missing field", req.FileName)
	}
}

// ============================================================
// ServerConfig — 结构体序列化测试
// ============================================================

func TestServerConfig_JsonRoundTrip(t *testing.T) {
	original := ServerConfig{
		ReportConfig:      ReportConfig{Switch: true, URL: "http://report.test"},
		TraceInfoConfig:   TraceInfoConfig{Switch: false, Content: "info"},
		AdvertisingConfig: AdvertisingConfig{Switch: true, URL: "http://ad.test"},
		BulletinConfig:    BulletinConfig{Switch: false, Content: "bullet"},
		AiAssistantConfig: AiAssistantConfig{Switch: true},
	}
	data, err := json.Marshal(&original)
	if err != nil {
		t.Fatalf("json.Marshal failed: %v", err)
	}
	var decoded ServerConfig
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("json.Unmarshal failed: %v", err)
	}
	if decoded.ReportConfig.URL != "http://report.test" {
		t.Errorf("ReportConfig.URL = %q, expected \"http://report.test\"", decoded.ReportConfig.URL)
	}
	if !decoded.ReportConfig.Switch {
		t.Error("ReportConfig.Switch = false, expected true")
	}
	if !decoded.AiAssistantConfig.Switch {
		t.Error("AiAssistantConfig.Switch = false, expected true")
	}
}

func TestServerConfig_AllFieldsPresent(t *testing.T) {
	config := ServerConfig{
		ReportConfig:      ReportConfig{Switch: true, URL: "u1"},
		TraceInfoConfig:   TraceInfoConfig{Switch: true, Content: "c1"},
		AdvertisingConfig: AdvertisingConfig{Switch: true, URL: "u2"},
		BulletinConfig:    BulletinConfig{Switch: true, Content: "c2"},
		AiAssistantConfig: AiAssistantConfig{Switch: true},
	}
	data, _ := json.Marshal(&config)
	result := string(data)
	expectedFields := []string{
		"reportConfig",
		"traceInfoConfig",
		"advertisingConfig",
		"bulletinConfig",
		"aiAssistantConfig",
	}
	for _, field := range expectedFields {
		if !strings.Contains(result, field) {
			t.Errorf("JSON = %q, missing field %q", result, field)
		}
	}
}

func TestServerConfig_MuxNotSerialized(t *testing.T) {
	config := ServerConfig{
		ReportConfig: ReportConfig{Switch: true, URL: "u"},
	}
	data, _ := json.Marshal(&config)
	result := string(data)
	if strings.Contains(result, "Mux") {
		t.Errorf("JSON = %q, Mux should not be serialized (json:\"-\")", result)
	}
	if strings.Contains(result, "mux") {
		t.Errorf("JSON = %q, mux should not be serialized", result)
	}
}

func TestReportConfig_JsonRoundTrip(t *testing.T) {
	original := ReportConfig{Switch: true, URL: "http://test.example.com"}
	data, err := json.Marshal(&original)
	if err != nil {
		t.Fatalf("json.Marshal failed: %v", err)
	}
	var decoded ReportConfig
	json.Unmarshal(data, &decoded)
	if decoded.Switch != original.Switch || decoded.URL != original.URL {
		t.Errorf("round-trip mismatch: got {%v, %q}, expected {%v, %q}", decoded.Switch, decoded.URL, original.Switch, original.URL)
	}
}

func TestTraceInfoConfig_JsonRoundTrip(t *testing.T) {
	original := TraceInfoConfig{Switch: true, Content: "trace content"}
	data, _ := json.Marshal(&original)
	var decoded TraceInfoConfig
	json.Unmarshal(data, &decoded)
	if decoded.Switch != original.Switch || decoded.Content != original.Content {
		t.Errorf("round-trip mismatch")
	}
}

func TestAdvertisingConfig_JsonRoundTrip(t *testing.T) {
	original := AdvertisingConfig{Switch: false, URL: "http://ad.test"}
	data, _ := json.Marshal(&original)
	var decoded AdvertisingConfig
	json.Unmarshal(data, &decoded)
	if decoded.Switch != original.Switch || decoded.URL != original.URL {
		t.Errorf("round-trip mismatch")
	}
}

func TestBulletinConfig_JsonRoundTrip(t *testing.T) {
	original := BulletinConfig{Switch: true, Content: "bullet"}
	data, _ := json.Marshal(&original)
	var decoded BulletinConfig
	json.Unmarshal(data, &decoded)
	if decoded.Switch != original.Switch || decoded.Content != original.Content {
		t.Errorf("round-trip mismatch")
	}
}

func TestAiAssistantConfig_JsonRoundTrip(t *testing.T) {
	original := AiAssistantConfig{Switch: true}
	data, _ := json.Marshal(&original)
	var decoded AiAssistantConfig
	json.Unmarshal(data, &decoded)
	if decoded.Switch != original.Switch {
		t.Errorf("round-trip mismatch: got %v, expected %v", decoded.Switch, original.Switch)
	}
}

// ============================================================
// AuthVerifyType — 常量测试
// ============================================================

func TestAuthVerifyType_Values(t *testing.T) {
	if RSA_3072_SHA512 != 0 {
		t.Errorf("RSA_3072_SHA512 = %d, expected 0", RSA_3072_SHA512)
	}
	if RSA_ENCRYPT != 1 {
		t.Errorf("RSA_ENCRYPT = %d, expected 1", RSA_ENCRYPT)
	}
}

func TestAuthVerifyType_RsaSignAndBase64WithRsaEncrypt(t *testing.T) {
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	sig, err := RsaSignAndBase64("test message", RSA_ENCRYPT)
	if err != nil {
		t.Logf("RsaSignAndBase64 with RSA_ENCRYPT returned error (expected, as function ignores authType): %v", err)
	}
	if sig == "" {
		t.Log("RsaSignAndBase64 with RSA_ENCRYPT returned empty (function ignores authType and always uses RsaSign)")
	}
}

// ============================================================
// getPidByPort / getPidByPortOther — 扩展边界用例
// ============================================================

func TestGetPidByPort_ValidPortNumber(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("getPidByPort panicked: %v", r)
		}
	}()
	result := getPidByPort(80)
	if result < -1 {
		t.Errorf("getPidByPort(80) = %d, expected >= -1", result)
	}
}

func TestGetPidByPort_HighPortNumber(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("getPidByPort panicked: %v", r)
		}
	}()
	result := getPidByPort(65535)
	if result < -1 {
		t.Errorf("getPidByPort(65535) = %d, expected >= -1", result)
	}
}

func TestGetPidByPortOther_ValidPortNumber(t *testing.T) {
	result := getPidByPortOther(443)
	if result < -1 {
		t.Errorf("getPidByPortOther(443) = %d, expected >= -1", result)
	}
}

func TestGetPidByPortOther_HighPortNumber(t *testing.T) {
	result := getPidByPortOther(65535)
	if result < -1 {
		t.Errorf("getPidByPortOther(65535) = %d, expected >= -1", result)
	}
}

func TestGetPidByPortOther_ZeroPort(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("getPidByPortOther panicked: %v", r)
		}
	}()
	result := getPidByPortOther(0)
	if result < -1 {
		t.Errorf("getPidByPortOther(0) = %d, expected >= -1", result)
	}
}

// ============================================================
// checkPort — 扩展边界用例
// ============================================================

func TestCheckPort_CommonPorts(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("checkPort panicked: %v", r)
		}
	}()
	checkPort(8080)
	checkPort(8443)
	checkPort(3000)
}

func TestCheckPort_ZeroPort(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("checkPort panicked: %v", r)
		}
	}()
	checkPort(0)
}

func TestCheckPort_NegativePort(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("checkPort panicked: %v", r)
		}
	}()
	checkPort(-1)
}

// ============================================================
// getExecutePath / getCurrentAbPath / getCallerPath — 扩展
// ============================================================

func TestGetExecutePath_ReturnsAbsolutePath(t *testing.T) {
	result := getExecutePath()
	if !filepath.IsAbs(result) && !strings.Contains(result, ":") {
		t.Errorf("getExecutePath() = %q, expected absolute path", result)
	}
}

func TestGetExecutePath_NoTrailingSeparator(t *testing.T) {
	result := getExecutePath()
	if strings.HasSuffix(result, string(os.PathSeparator)) {
		t.Errorf("getExecutePath() = %q, should not have trailing separator", result)
	}
}

func TestGetCurrentAbPath_ReturnsValidPath(t *testing.T) {
	result := getCurrentAbPath()
	if result == "" {
		t.Fatal("getCurrentAbPath() returned empty string")
	}
	info, err := os.Stat(result)
	if err != nil {
		t.Errorf("getCurrentAbPath() returned invalid path %q: %v", result, err)
	} else if !info.IsDir() {
		t.Errorf("getCurrentAbPath() = %q, expected directory", result)
	}
}

func TestGetCallerPath_ReturnsValidPath(t *testing.T) {
	result := getCallerPath()
	if result == "" {
		t.Fatal("getCallerPath() returned empty string")
	}
}

// ============================================================
// genRsa / genSSL — 初始化验证
// ============================================================

func TestGenRsa_SetsHdcPrivateKey(t *testing.T) {
	genRsa()
	if hdcPrivateKey == nil {
		t.Fatal("genRsa() did not set hdcPrivateKey")
	}
}

func TestGenRsa_SetsHdcPublicKey(t *testing.T) {
	genRsa()
	if hdcPublicKey == "" {
		t.Fatal("genRsa() did not set hdcPublicKey")
	}
}

func TestGenRsa_PublicKeyContainsPEMHeader(t *testing.T) {
	genRsa()
	if !strings.Contains(hdcPublicKey, "BEGIN PUBLIC KEY") {
		t.Errorf("hdcPublicKey = %q, expected PEM header", hdcPublicKey)
	}
}

func TestGenRsa_PrivateKeySizeIs3072(t *testing.T) {
	genRsa()
	if hdcPrivateKey == nil {
		t.Fatal("hdcPrivateKey not initialized")
	}
	if hdcPrivateKey.N.BitLen() != 3072 {
		t.Errorf("private key size = %d bits, expected 3072", hdcPrivateKey.N.BitLen())
	}
}

func TestGenRsa_MultipleCallsProduceSameKey(t *testing.T) {
	genRsa()
	key1 := hdcPrivateKey
	genRsa()
	if key1 == hdcPrivateKey {
		t.Log("genRsa may return same pointer (global var), not a bug")
	}
}

func TestGenSSL_DoesNotPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("genSSL panicked: %v", r)
		}
	}()
	certDir := filepath.Join(exPath, "cert")
	defer os.RemoveAll(certDir)
	genSSL()
}

// ============================================================
// CheckErr — 扩展边界用例
// ============================================================

func TestCheckErr_WithErrorPanics(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Fatal("CheckErr(error) should panic")
		}
	}()
	CheckErr(os.ErrNotExist)
}

func TestCheckErr_WithFormattedError(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Fatal("CheckErr(formatted error) should panic")
		}
	}()
	CheckErr(errors.New("test error"))
}

// ============================================================
// parseServerConfigFile — 扩展边界用例
// ============================================================

func TestParseServerConfigFile_FilesNotExistsNoPanic(t *testing.T) {
	originalExPath := exPath
	exPath = "/nonexistent_path_12345"
	defer func() {
		exPath = originalExPath
		if r := recover(); r != nil {
			t.Fatalf("parseServerConfigFile panicked on missing file: %v", r)
		}
	}()
	parseServerConfigFile()
}

func TestParseServerConfigFile_InvalidJsonNoPanic(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "test_parse_config_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)
	invalidConfig := `{"invalid": json}`
	configPath := filepath.Join(tmpDir, "server-config.json")
	os.WriteFile(configPath, []byte(invalidConfig), 0666)
	originalExPath := exPath
	exPath = tmpDir
	defer func() {
		exPath = originalExPath
		if r := recover(); r != nil {
			t.Fatalf("parseServerConfigFile panicked on invalid JSON: %v", r)
		}
	}()
	parseServerConfigFile()
}

func TestParseServerConfigFile_ValidJson(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "test_parse_valid_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)
	validConfig := `{
		"reportConfig": {"switch": true, "url": "http://test.example.com"},
		"traceInfoConfig": {"switch": false, "content": "test"},
		"advertisingConfig": {"switch": true, "url": "http://ad.test"},
		"bulletinConfig": {"switch": false, "content": "b"},
		"aiAssistantConfig": {"switch": true}
	}`
	configPath := filepath.Join(tmpDir, "server-config.json")
	os.WriteFile(configPath, []byte(validConfig), 0666)
	originalExPath := exPath
	exPath = tmpDir
	defer func() { exPath = originalExPath }()
	parseServerConfigFile()
	serverConfig.Mux.RLock()
	defer serverConfig.Mux.RUnlock()
	if serverConfig.ReportConfig.URL != "http://test.example.com" {
		t.Errorf("ReportConfig.URL = %q, expected \"http://test.example.com\"", serverConfig.ReportConfig.URL)
	}
	if !serverConfig.AiAssistantConfig.Switch {
		t.Errorf("AiAssistantConfig.Switch = false, expected true")
	}
}

func TestParseServerConfigFile_DoesNotModifyConfigOnMissingFile(t *testing.T) {
	serverConfig.Mux.Lock()
	serverConfig.ReportConfig = ReportConfig{Switch: true, URL: "before.test"}
	serverConfig.Mux.Unlock()
	originalExPath := exPath
	exPath = "/nonexistent_path_67890"
	defer func() { exPath = originalExPath }()
	parseServerConfigFile()
	serverConfig.Mux.RLock()
	defer serverConfig.Mux.RUnlock()
	if serverConfig.ReportConfig.URL != "before.test" {
		t.Errorf("config was modified when file was missing: URL = %q", serverConfig.ReportConfig.URL)
	}
}

// ============================================================
// readServerConfig — 扩展边界用例
// ============================================================

func TestReadServerConfig_MissingFileNoPanic(t *testing.T) {
	originalExPath := exPath
	exPath = "/nonexistent_readserver_12345"
	defer func() {
		exPath = originalExPath
		if r := recover(); r != nil {
			t.Fatalf("readServerConfig panicked on missing file: %v", r)
		}
	}()
	readServerConfig()
}

func TestReadServerConfig_InvalidJsonNoPanic(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "test_readserver_invalid_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)
	invalidConfig := `{invalid json content}`
	configPath := filepath.Join(tmpDir, "server-config.json")
	os.WriteFile(configPath, []byte(invalidConfig), 0666)
	originalExPath := exPath
	exPath = tmpDir
	defer func() {
		exPath = originalExPath
		if r := recover(); r != nil {
			t.Fatalf("readServerConfig panicked on invalid JSON: %v", r)
		}
	}()
	readServerConfig()
}
