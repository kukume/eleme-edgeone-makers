# eleme-edgeone-makers

饿了么 H5 短信登录 + 阿里指纹 API，部署到腾讯云 EdgeOne Makers Cloud Functions。

> 当前不做鉴权，公网可被滥用发短信，仅建议自用。

## 接口

Base 以你的域名为准，例如 `https://your-domain.example`。

### `GET /api/eleme/health`

```bash
curl -sS "$BASE/api/eleme/health"
```

成功：`{ ok, service, ts }`

### `POST /api/eleme/fp`

```bash
curl -sS -X POST "$BASE/api/eleme/fp" \
  -H "content-type: application/json" \
  -d "{}"
```

成功：`{ ok, ua, bxUa, bxUmidToken, cookies }`

### `POST /api/eleme/sms/send`

```bash
curl -sS -X POST "$BASE/api/eleme/sms/send" \
  -H "content-type: application/json" \
  -d '{"phone":"13800138000"}'
```

可选字段：`phoneCode`（默认 `"86"`）。

成功：`{ ok, session }` —— 请把整个 `session` 原样带回登录接口。

### `POST /api/eleme/sms/login`

```bash
curl -sS -X POST "$BASE/api/eleme/sms/login" \
  -H "content-type: application/json" \
  -d '{"session":{...},"smsCode":"123456"}'
```

成功：`{ ok, cookie, userId, sid, username, st }`

## 部署

1. 从 GitHub Release **`latest`** 下载 `eleme-edgeone-upload.zip`  
   （或本机执行 `npm ci && npm run pack` 生成同名 zip）
2. 在 EdgeOne Makers / Pages 控制台上传该 zip 并部署
3. 仓库内 `edgeone.json` 已配置：
   - Node `20.18.0`
   - `installCommand`: `npm install`
   - `buildCommand`: `npm run build`
   - `outputDirectory`: `public`
   - Cloud Functions `maxDuration: 120`
   - `externalNodeModules`: `["jsdom"]`
4. 部署后验证：

```bash
export BASE=https://你的域名
curl -sS "$BASE/api/eleme/health"
curl -sS -X POST "$BASE/api/eleme/fp" -H "content-type: application/json" -d "{}"
```
