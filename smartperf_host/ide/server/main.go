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

//遇到报错请在当前目录下执行这个命令： go mod download golang.org/x/text
import (
	"bufio"
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha512"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"math/big"
	"mime"
	"net"
	"net/http"
	"net/http/cookiejar"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

const HttpPort = 9000

const (
	defaultShellTimeout    = 5 * time.Minute
	heredocFallbackTimeout = 60 * time.Minute
	fileRecvTimeout        = 30 * time.Minute
	traceTimeoutBuffer     = 2 * time.Minute
	defaultLogFilePerm     = 0o666
)

var exPath string
var serverConfig ServerConfig
var hdcPublicKey string
var hdcPrivateKey *rsa.PrivateKey
var hdcCmdMode bool

// CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build main.go
// CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build main.go
func cors(fs http.Handler, version string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// return if you do not want the FileServer handle a specific request
		r.Header.Add("Cross-Origin-Opener-Policy", "same-origin")
		r.Header.Add("Cross-Origin-Embedder-Policy", "require-corp")
		w.Header().Add("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Add("Cross-Origin-Embedder-Policy", "require-corp")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "x-requested-with, authorization, blade-auth") //*
		w.Header().Set("Access-Control-Allow-Methods", "*")                                           //*
		w.Header().Set("Access-Control-Max-Age", "3600")
		w.Header().Set("data-version", version)
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Pragma", "no-cache")
		fs.ServeHTTP(w, r)
	}
}

// AuthVerifyType 定义签名和验证的类型
type AuthVerifyType int

const (
	RSA_3072_SHA512 AuthVerifyType = iota
	RSA_ENCRYPT
)

// RsaSign 生成 RSA 签名
func RsaSign(buf string, signKey *rsa.PrivateKey) (string, error) {
	hash := sha512.Sum512([]byte(buf))
	signature, err := rsa.SignPSS(rand.Reader, signKey, crypto.SHA512, hash[:], &rsa.PSSOptions{
		SaltLength: rsa.PSSSaltLengthEqualsHash,
	})
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(signature), nil
}

// RsaSignAndBase64 生成 RSA 签名并进行 Base64 编码
func RsaSignAndBase64(buf string, authType AuthVerifyType) (string, error) {
	var signResult string
	var err error
	signResult, err = RsaSign(buf, hdcPrivateKey)
	if err != nil {
		return "", err
	}

	return signResult, nil
}

func exist(path string) bool {
	_, err := os.Stat(path)
	if err != nil {
		if os.IsExist(err) {
			return true
		}
		return false
	}
	return true
}

func genSSL() {
	if exist("cert/keyFile.key") || exist("cert/certFile.pem") {
		fmt.Println("keyFile.key exists")
		return
	}
	max := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, _ := rand.Int(rand.Reader, max)
	subject := pkix.Name{
		Organization:       []string{"www.smartperf.com"},
		OrganizationalUnit: []string{"ITs"},
		CommonName:         "www.smartperf.com",
	}
	certificate509 := x509.Certificate{
		SerialNumber: serialNumber,
		Subject:      subject,
		NotBefore:    time.Now(),
		NotAfter:     time.Now().AddDate(10, 0, 0),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
	}
	chekDir("cert")
	pk, _ := rsa.GenerateKey(rand.Reader, 3072)
	derBytes, _ := x509.CreateCertificate(rand.Reader, &certificate509, &certificate509, &pk.PublicKey, pk)
	certOut, _ := os.Create("cert/certFile.pem")
	pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	certOut.Close()
	keyOut, _ := os.Create("cert/keyFile.key")
	pem.Encode(keyOut, &pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(pk)})
	keyOut.Close()
}

func genRsa() {
	// generate hdc private key
	privateKey, err := rsa.GenerateKey(rand.Reader, 3072)
	if err != nil {
		fmt.Println("Generate hdc rsa private key failed")
		return
	}
	hdcPrivateKey = privateKey

	// generate hdc public key
	publicKey := &privateKey.PublicKey
	pkixPublicKey, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		fmt.Println(err)
		return
	}
	publicKeyBlock := &pem.Block{
		Type: "PUBLIC KEY",

		Bytes: pkixPublicKey,
	}
	hdcPublicKey = string(pem.EncodeToMemory(publicKeyBlock))
}

func main() {
	port := HttpPort
	isOpen := 1
	flag.IntVar(&port, "p", HttpPort, "The port number used")
	flag.IntVar(&isOpen, "o", 1, "Whether to immediately open the website in your browser; 1 is true; 0 is false")
	flag.Parse()
	if isOpen < 0 || isOpen > 1 {
		fmt.Println("Error: -o must be 0 or 1")
		return
	}
	checkPort(port)
	genSSL()
	genRsa()
	hdcCmdMode = checkHdcAvailable()
	exPath = getCurrentAbPath()
	fmt.Println(exPath)
	go func() {
		version := ""
		readVersion, versionErr := os.ReadFile(exPath + "/version.txt")
		if versionErr != nil {
			version = ""
		} else {
			version = string(readVersion)
		}
		readServerConfig()
		serverConfig.HdcCmdMode = hdcCmdMode
		mux := http.NewServeMux()
		mime.TypeByExtension(".js")
		mime.AddExtensionType(".js", "application/javascript")
		log.Println(mime.TypeByExtension(".js"))
		mux.HandleFunc("/application/logger", consoleHandler)
		mux.Handle("/application/upload/", http.StripPrefix("/application/upload/", http.FileServer(http.Dir(filepath.FromSlash(exPath+"/upload")))))
		mux.HandleFunc("/application/download-file", downloadHandler)
		mux.HandleFunc("/application/hdcPublicKey", getHdcPublicKey)
		mux.HandleFunc("/application/encryptHdcMsg", encryptHdcMsg)
		mux.HandleFunc("/application/signatureHdcMsg", signatureHdcMsg)
		mux.HandleFunc("/application/serverconfig", getServerConfig)
		mux.HandleFunc("/hdcCmd", hdcCmdHandler)
		fs := http.FileServer(http.Dir(exPath + "/"))
		mux.Handle("/application/", http.StripPrefix("/application/", cors(fs, version)))
		go func() {
			ser := &http.Server{
				Addr:    fmt.Sprintf(":%d", port),
				Handler: mux,
			}
			log.Println(fmt.Sprintf("HTTPS[%d]服务启动", port))
			err := ser.ListenAndServeTLS("cert/certFile.pem", "cert/keyFile.key")
			CheckErr(err)
		}()
		go func() {
			ser := &http.Server{
				Addr:    fmt.Sprintf(":%d", port+1),
				Handler: mux,
			}
			log.Println(fmt.Sprintf("HTTP[%d]服务启动", port))
			err := ser.ListenAndServe()
			CheckErr(err)
		}()
		if isOpen == 1 {
			open(fmt.Sprintf("https://localhost:%d/application", port))
		}
	}()
	select {}
}

func getPidByPort(portNumber int) int {
	resPid := -1
	var out bytes.Buffer
	cmdRes := exec.Command("cmd", "/c", fmt.Sprintf("netstat -ano -p tcp | findstr %d", portNumber))
	cmdRes.Stdout = &out
	cmdRes.Run()
	cmdResStr := out.String()
	findStr := regexp.MustCompile(`\s\d+\s`).FindAllString(cmdResStr, -1)
	if len(findStr) > 0 {
		pid, err := strconv.Atoi(strings.TrimSpace(findStr[0]))
		if err != nil {
			resPid = -1
		} else {
			resPid = pid
		}
	}
	return resPid
}

type LoggerReq struct {
	FileName string `json:"fileName"`
	FileSize string `json:"fileSize"`
}

func consoleHandler(w http.ResponseWriter, r *http.Request) {
	chekDir(exPath + "/logger")
	var now = time.Now()
	var fileName = fmt.Sprintf("%d-%d-%d", now.Year(), now.Month(), now.Day())
	dst, err := os.OpenFile(exPath+"/logger/"+fileName, os.O_WRONLY|os.O_CREATE|os.O_APPEND|os.O_SYNC, defaultLogFilePerm)
	CheckErr(err)
	contentType := r.Header["Content-Type"]
	if len(contentType) > 0 {
		contentTypeName := contentType[0]
		if strings.HasPrefix(contentTypeName, "application/json") {
			decoder := json.NewDecoder(r.Body)
			var req LoggerReq
			decoder.Decode(&req)
			dst.WriteString(fmt.Sprintf("%s %s (%s M)\n", now.Format("2006-01-02 15:04:05"), req.FileName, req.FileSize))
			fmt.Fprintf(w, fmt.Sprintf("日志写入成功%s", exPath))
		}
	}
}

func getHdcPublicKey(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/json")
	resp(&w)(true, 0, "success", map[string]interface{}{
		"publicKey": hdcPublicKey,
	})
}

func encryptHdcMsg(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/json")
	hdcMsg := r.URL.Query().Get("message")
	if len(hdcMsg) == 0 {
		resp(&w)(false, -1, "Invalid message", nil)
		return
	}
	signatures, err := rsa.SignPKCS1v15(nil, hdcPrivateKey, crypto.Hash(0), []byte(hdcMsg))
	if err != nil {
		resp(&w)(false, -1, "sign failed", nil)
	} else {
		resp(&w)(true, 0, "success", map[string]interface{}{
			"signatures": base64.StdEncoding.EncodeToString(signatures),
		})
	}
}

func signatureHdcMsg(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/json")
	hdcMsg := r.URL.Query().Get("message")
	authType := RSA_3072_SHA512
	signResult, err := RsaSignAndBase64(hdcMsg, authType)
	if len(hdcMsg) == 0 {
		resp(&w)(false, -1, "Invalid message", nil)
		return
	}
	if err != nil {
		resp(&w)(false, -1, "sign failed", nil)
	} else {
		resp(&w)(true, 0, "success", map[string]interface{}{
			"signatures": signResult,
		})
	}
}

func parseServerConfigFile() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("parseServerConfigFile happen panic, content is %+v\n", r)
		}
	}()

	fmt.Println("parseServerConfigFile")
	serverConfigBuffer, err := os.ReadFile(exPath + "/server-config.json")
	if err != nil {
		fmt.Printf("read server config failed, error: %v\n", err)
		return
	}

	serverConfig.Mux.Lock()
	defer serverConfig.Mux.Unlock()
	err = json.Unmarshal(serverConfigBuffer, &serverConfig)
	if err != nil {
		fmt.Printf("unmarshal server config failed, error: %v\n", err)
		return
	}
}

// checkHdcAvailable 检测系统 PATH 中是否可用 hdc 命令行工具
func checkHdcAvailable() bool {
	for _, name := range []string{"hdc", "hdc_std"} {
		if _, err := exec.LookPath(name); err == nil {
			fmt.Println(name + " found in PATH, hdc cmd mode is available")
			return true
		}
	}
	fmt.Println("hdc/hdc_std not found in PATH, WebUSB mode will be used")
	return false
}

func getServerConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	serverConfig.Mux.RLock()
	defer serverConfig.Mux.RUnlock()
	data, err := json.Marshal(&serverConfig)
	if err != nil {
		http.Error(w, "failed to marshal config: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

type ServerConfig struct {
	ReportConfig      ReportConfig      `json:"reportConfig"`
	TraceInfoConfig   TraceInfoConfig   `json:"traceInfoConfig"`
	AdvertisingConfig AdvertisingConfig `json:"advertisingConfig"`
	BulletinConfig    BulletinConfig    `json:"bulletinConfig"`
	AiAssistantConfig AiAssistantConfig `json:"aiAssistantConfig"`
	HdcCmdMode        bool              `json:"hdcCmdMode"`
	Mux               sync.RWMutex      `json:"-"`
}

type ReportConfig struct {
	Switch bool   `json:"switch"`
	URL    string `json:"url"`
}

type TraceInfoConfig struct {
	Switch  bool   `json:"switch"`
	Content string `json:"content"`
}

type AdvertisingConfig struct {
	Switch bool   `json:"switch"`
	URL    string `json:"url"`
}

type BulletinConfig struct {
	Switch  bool   `json:"switch"`
	Content string `json:"content"`
}

type AiAssistantConfig struct {
	Switch bool `json:"switch"`
}

func loopUpdateServerConfig() {
	loopTime := 5 * time.Minute
	timer := time.NewTimer(loopTime)
	for {
		select {
		case <-timer.C:
			parseServerConfigFile()
		}
		timer.Reset(loopTime)
	}
}

func readServerConfig() {
	serverConfigBuffer, err := os.ReadFile(exPath + "/server-config.json")
	if err != nil {
		fmt.Printf("read server config failed, error: %v\n", err)
		return
	}

	err = json.Unmarshal(serverConfigBuffer, &serverConfig)
	if err != nil {
		fmt.Printf("unmarshal server config failed, error: %v\n", err)
		return
	}

	go loopUpdateServerConfig()
}

func mapToJson(m map[string]interface{}) (string, error) {
	marshal, err := json.Marshal(m)
	if err != nil {
		return "", err
	}
	var str = string(marshal)
	return str, nil
}
func jsonToMap(str string) (map[string]interface{}, error) {
	var m = make(map[string]interface{})
	err := json.Unmarshal([]byte(str), &m)
	if err != nil {
		return nil, err
	}
	return m, nil
}

// MkDir 创建目录
func MkDir(path string) {
	dir := path[0:strings.LastIndex(path, string(os.PathSeparator))] //从文件路径获取目录
	if _, err := os.Stat(dir); err != nil {                          //如果目录不存在，创建目录
		os.MkdirAll(dir, os.ModePerm)
	}
}

func resp(w *http.ResponseWriter) func(bool, int, string, map[string]interface{}) {
	return func(success bool, code int, msg string, obj map[string]interface{}) {
		toJson, err := mapToJson(map[string]interface{}{
			"success": success,
			"code":    code,
			"msg":     msg,
			"data":    obj,
		})
		if err != nil {
			errRes, _ := mapToJson(map[string]interface{}{
				"success": false,
				"code":    -1,
				"msg":     err.Error(),
			})
			fmt.Fprintf(*w, errRes)
		} else {
			fmt.Fprintf(*w, toJson)
		}
	}
}

func get(url string) (*http.Response, error) {
	jar, _ := cookiejar.New(nil)
	c := &http.Client{
		Transport:     &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}},
		CheckRedirect: nil,
		Jar:           jar,
		Timeout:       time.Duration(3600) * time.Second,
	}
	return c.Get(url)
}

func clearOverdueFile() {
	MkDir(filepath.FromSlash(fmt.Sprintf("./upload/")))
	now := time.Now()
	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		return
	}
	var checkDue = func(fileName string) bool {
		f := getSuffixByUrl(fileName)
		parseTime, err := time.ParseInLocation("20060102150405000", f.fileName, loc)
		if err != nil {
			return false
		}
		sub := now.Sub(parseTime)
		if sub.Minutes() > 60 { //bigger than 60 min flag due
			return true
		}
		return false
	}
	slash := filepath.FromSlash(fmt.Sprintf("./upload/"))
	filepath.WalkDir(slash, func(path string, d fs.DirEntry, err error) error {
		if checkDue(d.Name()) {
			fmt.Println(now, "delete->", path, d.Name(), err)
			os.Remove(path)
		}
		return nil
	})
}
func getSuffixByUrl(u string) struct {
	fileName string
	suffix   string
} {
	lastIndex := strings.LastIndex(u, "/")
	var f string
	if lastIndex != -1 {
		f = u[lastIndex:]
	} else {
		f = u
	}
	index := strings.LastIndex(f, ".")
	if index != -1 {
		return struct {
			fileName string
			suffix   string
		}{
			f[0:index],
			f[index:],
		}
	} else {
		return struct {
			fileName string
			suffix   string
		}{
			f,
			"",
		}
	}
}

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text/json")
	clearOverdueFile()
	contentType := r.Header["Content-Type"]
	if len(contentType) > 0 {
		contentTypeName := contentType[0]
		if strings.HasPrefix(contentTypeName, "application/x-www-form-urlencoded") {
			url := r.PostFormValue("url")
			res, err := get(url)
			if err != nil {
				resp(&w)(false, -1, err.Error(), nil)
				return
			}
			pth := filepath.FromSlash(fmt.Sprintf("/upload/%s%s", time.Now().Format("20060102150405000"), getSuffixByUrl(url).suffix))
			MkDir("." + pth)
			create, err := os.Create("." + pth)
			if err != nil {
				resp(&w)(false, -1, err.Error(), nil)
				return
			}
			written, err := io.Copy(create, res.Body)
			if err != nil {
				resp(&w)(false, -1, err.Error(), nil)
				return
			}
			fmt.Println(url, written)
			resp(&w)(true, 0, "success", map[string]interface{}{
				"url":  pth,
				"size": written,
			})
			return
		}
	}
	resp(&w)(false, -1, "请求方式错误", nil)
}

// HdcCmdReq hdc 命令执行请求，兼容前端 Cmd.execHdcCmd / Cmd.execFileRecv 的调用格式
type HdcCmdReq struct {
	Cmd          string `json:"cmd"`
	Tag          string `json:"tag"`
	FileName     string `json:"fileName"`
	SerialNumber string `json:"serialNumber"`
}

// hdcCmdHandler 通过 hdc 命令行工具与设备交互，替代浏览器 WebUSB 链路
//
//	tag=shell / hiprofiler_cmd : 执行 hdc 命令并返回 stdout
//	tag=file                   : 执行 hdc file recv 拉取设备文件，返回二进制流
func hdcCmdHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "*")
	w.Header().Set("Access-Control-Allow-Headers", "x-requested-with, authorization, blade-auth, content-type")
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodPost {
		resp(&w)(false, -1, "method not allowed", nil)
		return
	}
	var req HdcCmdReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		resp(&w)(false, -1, "invalid request body: "+err.Error(), nil)
		return
	}
	if strings.TrimSpace(req.Cmd) == "" {
		resp(&w)(false, -1, "empty cmd", nil)
		return
	}
	// 归一化 hdc_std → hdc（PC 上可能只安装了 hdc）
	if strings.HasPrefix(req.Cmd, "hdc_std ") {
		req.Cmd = "hdc " + req.Cmd[8:]
	} else if req.Cmd == "hdc_std" {
		req.Cmd = "hdc"
	}
	// hiprofiler_cmd tag：前端发送的是裸命令，需要包装 hdc shell 前缀
	if req.Tag == "hiprofiler_cmd" {
		if req.SerialNumber != "" {
			req.Cmd = "hdc -t " + req.SerialNumber + " shell " + req.Cmd
		} else {
			req.Cmd = "hdc shell " + req.Cmd
		}
	}
	if req.Tag == "file" {
		hdcFileRecvHandler(w, req)
		return
	}
	hdcShellHandler(w, req)
}

// hdcShellHandler 执行 hdc shell 类命令，返回 stdout
func hdcShellHandler(w http.ResponseWriter, req HdcCmdReq) {
	// 默认 5 分钟；trace 抓取（含 heredoc）命令从 -t 参数解析抓取时长 + 2 分钟缓冲
	timeout := defaultShellTimeout
	if strings.Contains(req.Cmd, "<<") {
		if secs, ok := parseTraceDuration(req.Cmd); ok {
			timeout = time.Duration(secs)*time.Second + traceTimeoutBuffer
		} else {
			timeout = heredocFallbackTimeout
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	var out bytes.Buffer
	var err error
	if strings.Contains(req.Cmd, "<<") {
		err = runHdcWithHeredoc(ctx, req.Cmd, &out)
	} else {
		cmd := buildShellCmd(ctx, req.Cmd)
		cmd.Stdout = &out
		cmd.Stderr = &out
		cmd.Stdin = nil
		err = cmd.Run()
	}
	if err != nil {
		resp(&w)(false, -1, err.Error(), map[string]interface{}{"output": out.String()})
		return
	}
	resp(&w)(true, 0, "success", map[string]interface{}{"output": out.String()})
}

// runHdcWithHeredoc 处理含 heredoc 的 hdc shell 命令。
// 命令格式: "hdc [-t SN] shell hiprofiler_cmd \  -c - \  ... \  <<CONFIG{config}CONFIG"
//
// 方案：先把配置内容推到设备临时文件，再用 -c /路径 非交互执行，彻底避免
//
//	交互式 hdc shell 不退出 / stdin 不转发的问题。
//	1. 提取 configPart，通过 hdc file send 推送到 /data/local/tmp/.hiprofiler_config_<rand>
//	2. 把命令中 -c - 替换为 -c /data/local/tmp/.hiprofiler_config_<rand>
//	3. hdc [-t SN] shell "cmdPart"  非交互执行，命令结束自动退出
//	4. hdc shell rm 删除临时配置文件
func runHdcWithHeredoc(ctx context.Context, full string, out *bytes.Buffer) error {
	shellCmd, hdcArgs, ok := splitHdcShellCmd(full)
	if !ok {
		cmd := buildShellCmd(ctx, full)
		cmd.Stdout = out
		cmd.Stderr = out
		cmd.Stdin = nil
		return cmd.Run()
	}
	// 拆分 heredoc："<<CONFIG{config}CONFIG" → cmdPart + configPart
	cmdPart := shellCmd
	configPart := ""
	if idx := strings.Index(shellCmd, "<<CONFIG"); idx != -1 {
		cmdPart = shellCmd[:idx]
		configPart = shellCmd[idx+len("<<CONFIG"):]
		configPart = strings.TrimSuffix(configPart, "CONFIG")
	}
	configPart = strings.TrimSpace(configPart)
	// 清理行续接符（\<换行>），拼接成单行命令
	cmdPart = strings.ReplaceAll(cmdPart, "\\\n", " ")
	cmdPart = strings.ReplaceAll(cmdPart, "\\\r\n", " ")
	cmdPart = strings.TrimSpace(cmdPart)

	// 如果没有配置内容，直接非交互执行
	if configPart == "" {
		fullArgs := append(append([]string{}, hdcArgs...), cmdPart)
		cmd := exec.CommandContext(ctx, "hdc", fullArgs...)
		cmd.Stdout = out
		cmd.Stderr = out
		cmd.Stdin = nil
		return cmd.Run()
	}

	// 有配置内容：先推临时配置文件到设备
	// 从 hdcArgs 中提取 SN 参数（如果有）
	snArg := ""
	for i := 0; i < len(hdcArgs); i++ {
		if hdcArgs[i] == "-t" && i+1 < len(hdcArgs) {
			snArg = hdcArgs[i+1]
		}
	}
	// 生成本地临时配置文件
	localConfigFile, err := os.CreateTemp("", "hiprofiler_config_*.txt")
	if err != nil {
		return fmt.Errorf("create temp config file failed: %w", err)
	}
	localConfigPath := localConfigFile.Name()
	defer os.Remove(localConfigPath)
	if _, err := localConfigFile.WriteString(configPart); err != nil {
		localConfigFile.Close()
		return fmt.Errorf("write temp config file failed: %w", err)
	}
	localConfigFile.Close()

	// 设备端配置文件路径
	deviceConfigPath := "/data/local/tmp/.hiprofiler_config_" + filepath.Base(localConfigPath)

	// 步骤1：hdc file send 推送配置文件到设备
	var sendArgs []string
	if snArg != "" {
		sendArgs = append(sendArgs, "-t", snArg)
	}
	sendArgs = append(sendArgs, "file", "send", localConfigPath, deviceConfigPath)
	sendCmd := exec.CommandContext(ctx, "hdc", sendArgs...)
	var sendOut bytes.Buffer
	sendCmd.Stdout = &sendOut
	sendCmd.Stderr = &sendOut
	if err := sendCmd.Run(); err != nil {
		return fmt.Errorf("hdc file send config failed: %w, output: %s", err, sendOut.String())
	}

	// 步骤2：把命令中 -c - 替换为 -c <deviceConfigPath>
	cmdPart = strings.ReplaceAll(cmdPart, "-c -", "-c "+deviceConfigPath)

	// 步骤3：非交互执行 hiprofiler_cmd
	fullArgs := append(append([]string{}, hdcArgs...), cmdPart)
	runCmd := exec.CommandContext(ctx, "hdc", fullArgs...)
	runCmd.Stdout = out
	runCmd.Stderr = out
	runCmd.Stdin = nil
	runErr := runCmd.Run()

	// 步骤4：清理设备端临时配置文件（无论步骤3是否成功都执行）
	var rmArgs []string
	if snArg != "" {
		rmArgs = append(rmArgs, "-t", snArg)
	}
	rmArgs = append(rmArgs, "shell", "rm", "-f", deviceConfigPath)
	rmCmd := exec.CommandContext(ctx, "hdc", rmArgs...)
	rmCmd.Stdout = nil
	rmCmd.Stderr = nil
	rmCmd.Stdin = nil
	rmCmd.Run()

	return runErr
}

// splitHdcShellCmd 从 "hdc [-t SN] shell <command>" 中分离出 hdc 参数和 shell 命令
func splitHdcShellCmd(full string) (shellCmd string, hdcArgs []string, ok bool) {
	trimmed := strings.TrimSpace(full)
	if !strings.HasPrefix(trimmed, "hdc ") {
		return "", nil, false
	}
	rest := trimmed[4:]
	if strings.HasPrefix(rest, "-t ") {
		afterT := rest[3:]
		snEnd := strings.Index(afterT, " ")
		if snEnd == -1 {
			return "", nil, false
		}
		sn := afterT[:snEnd]
		remaining := strings.TrimSpace(afterT[snEnd:])
		if !strings.HasPrefix(remaining, "shell ") {
			return "", nil, false
		}
		shellCmd = strings.TrimSpace(remaining[6:])
		return shellCmd, []string{"-t", sn, "shell"}, true
	}
	if strings.HasPrefix(rest, "shell ") {
		shellCmd = strings.TrimSpace(rest[6:])
		return shellCmd, []string{"shell"}, true
	}
	if rest == "shell" {
		return "", []string{"shell"}, true
	}
	return "", nil, false
}

// hdcFileRecvHandler 执行 hdc file recv，把设备文件拉到本地临时目录后读取并返回二进制，最后清理
func hdcFileRecvHandler(w http.ResponseWriter, req HdcCmdReq) {
	ctx, cancel := context.WithTimeout(context.Background(), fileRecvTimeout)
	defer cancel()
	cmd := buildShellCmd(ctx, req.Cmd)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	cmd.Stdin = nil
	if err := cmd.Run(); err != nil {
		resp(&w)(false, -1, err.Error(), map[string]interface{}{"output": out.String()})
		return
	}
	fileName := req.FileName
	if fileName == "" {
		fileName = extractRecvFileName(req.Cmd)
	}
	localPath := filepath.Base(fileName)
	if localPath == "" || localPath == "." {
		resp(&w)(false, -1, "cannot determine local file name", nil)
		return
	}
	data, err := os.ReadFile(localPath)
	if err != nil {
		resp(&w)(false, -1, "read pulled file failed: "+err.Error(), nil)
		return
	}
	os.Remove(localPath)
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Write(data)
}

// buildShellCmd 构造跨平台的 shell 执行命令
func buildShellCmd(ctx context.Context, full string) *exec.Cmd {
	if isWindows() {
		return exec.CommandContext(ctx, "cmd", "/c", full)
	}
	return exec.CommandContext(ctx, "sh", "-c", full)
}

// extractRecvFileName 从 "hdc ... file recv /data/local/tmp/xxx.trace ./" 提取 basename
func extractRecvFileName(cmd string) string {
	idx := strings.Index(cmd, "file recv")
	if idx == -1 {
		return ""
	}
	rest := strings.TrimSpace(cmd[idx+len("file recv"):])
	fields := strings.Fields(rest)
	if len(fields) == 0 {
		return ""
	}
	src := fields[0]
	return src[strings.LastIndex(src, "/")+1:]
}

// parseTraceDuration 从 "hiprofiler_cmd ... -t <seconds>" 中解析抓取时长
// 命令格式: "hdc [-t SN] shell hiprofiler_cmd \  -c - \  -o ... \  -t 30 \  -s \  -k \  <<CONFIG"
// 正则从 hiprofiler_cmd 之后匹配第一个 -t <数字>，跳过 hdc -t <SN> 的序列号
var traceDurationRe = regexp.MustCompile(`hiprofiler_cmd[\s\S]*?-t\s+(\d+)`)

func parseTraceDuration(cmd string) (int, bool) {
	m := traceDurationRe.FindStringSubmatch(cmd)
	if len(m) >= 2 {
		secs, err := strconv.Atoi(m[1])
		if err == nil && secs > 0 {
			return secs, true
		}
	}
	return 0, false
}

func SplitLines(s string) []string {
	var lines []string
	sc := bufio.NewScanner(strings.NewReader(s))
	for sc.Scan() {
		lines = append(lines, sc.Text())
	}
	return lines
}

func readFileFirstLine(path string) string {
	file, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer file.Close()

	readFile := bufio.NewReader(file)
	line, readErr := readFile.ReadString('\n')
	if readErr != nil || io.EOF == err {
		return ""
	}
	return line
}

func PathExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func chekDir(path string) {
	_, err := os.Stat(path)
	if err != nil {
		err := os.Mkdir(path, os.ModePerm)
		if err != nil {
			fmt.Printf("mkdir failed![%v]\n", err)
		} else {
			fmt.Printf("mkdir success!\n")
		}
	}
}
func CheckErr(err error) {
	if err != nil {
		log.Panicln(err)
	}
}

func open(url string) error {
	if isWindows() {
		return openUrlWindows(url)
	} else if isDarwin() {
		return openUrlDarwin(url)
	} else {
		return openUrlOther(url)
	}
}

func openUrlWindows(url string) error {
	cmd := "cmd"
	args := []string{"/c", "start", url}
	return exec.Command(cmd, args...).Start()
}
func openUrlDarwin(url string) error {
	var cmd = "open"
	var args = []string{url}
	return exec.Command(cmd, args...).Start()
}
func openUrlOther(url string) error {
	var cmd = "xdg-open"
	var args = []string{url}
	return exec.Command(cmd, args...).Start()
}

func isWindows() bool {
	return runtime.GOOS == "windows"
}
func isDarwin() bool {
	return runtime.GOOS == "darwin"
}

func getCurrentAbPath() string {
	dir := getExecutePath()
	tmpDir, _ := filepath.EvalSymlinks(os.TempDir())
	if tmpDir != "" && strings.HasPrefix(dir, tmpDir) {
		if wd, err := os.Getwd(); err == nil {
			return wd
		}
	}
	return dir
}

func getExecutePath() string {
	pth, err := os.Executable()
	if err != nil {
		log.Fatal(err)
	}
	res, _ := filepath.EvalSymlinks(filepath.Dir(pth))
	return res
}

func checkPort(port int) {
	if isWindows() {
		pid := getPidByPort(port)
		if pid != -1 {
			res := exec.Command("cmd", "/c", fmt.Sprintf("taskkill /F /PID %d /T", pid))
			res.Run()
		}
	}
}
