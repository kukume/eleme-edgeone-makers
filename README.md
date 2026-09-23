# eleme-edgeone-makers

饿了么 H5 短信登录 + 阿里指纹 API，部署到腾讯云 EdgeOne Makers Cloud Functions。

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
