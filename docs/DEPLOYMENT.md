# 后端部署指南

## 方案选择

### 方案 A: 阿里云 ECS（推荐，¥60/月起）

适用场景：正式上架，需要稳定可靠的后端

#### 1. 购买服务器
- 阿里云 ECS 轻量应用服务器
- 配置：1 核 2G，20G SSD，3M 带宽
- 系统：Ubuntu 22.04 LTS
- 约 ¥60/月

#### 2. 环境安装
```bash
ssh root@your-server-ip

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 PM2 进程管理
npm install -g pm2

# 安装 Nginx
apt-get install -y nginx

# 安装 SQLite
apt-get install -y sqlite3
```

#### 3. 部署应用
```bash
# 上传代码（或用 git clone）
cd /opt
git clone your-repo-url kaoyan-vocabulary
cd kaoyan-vocabulary/server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env
# 修改：
#   JWT_SECRET=随机字符串
#   NODE_ENV=production
#   FRONTEND_URL=https://your-domain.com
#   QQ_APP_ID=...（如使用）
#   WX_APP_ID=...（如使用）
#   SMS_ACCESS_KEY_ID=...（如使用）

# 初始化数据库 + 种子数据
cd ../data
npm install
npx ts-node seed.ts

# 构建后端
cd ../server
npm run build

# PM2 启动
pm2 start dist/index.js --name yanci-api
pm2 save
pm2 startup
```

#### 4. Nginx 配置
```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /api/health {
        proxy_pass http://127.0.0.1:5000;
    }
}
```

#### 5. SSL (HTTPS)
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d api.your-domain.com
# 自动续期
certbot renew --dry-run
```

#### 6. 数据库备份（每日 cron）
```bash
cat > /etc/cron.daily/yanci-backup << 'EOF'
#!/bin/bash
BACKUP_DIR=/opt/backups/yanci
mkdir -p $BACKUP_DIR
cp /opt/kaoyan-vocabulary/data/kaoyan.db $BACKUP_DIR/kaoyan-$(date +%Y%m%d).db
# 保留最近 30 天
find $BACKUP_DIR -name '*.db' -mtime +30 -delete
EOF
chmod +x /etc/cron.daily/yanci-backup
```

---

### 方案 B: 内网穿透（零成本，临时用）

适用场景：个人使用、测试阶段

1. 本地启动后端: `cd server && npm run dev`
2. 使用 ngrok/frp 暴露端口:
   ```bash
   ngrok http 5000
   ```
3. 将生成的 URL（如 `https://xxx.ngrok-free.app`）填入 `.env` 的 `VITE_API_URL`

限制：免费版 ngrok 每次重启 URL 会变，且带宽有限。

---

### 方案 C: Render.com / Railway（Serverless）

适用场景：不想管理服务器

- Render.com: 免费额度 750小时/月，支持 Express
- Railway.app: 按用量计费

需要将 Express 构建产物部署上去，SQLite 需要注意持久化存储问题（Render 的 disk 在两小时后会清除非持久化文件）。

---

## 前端关联

部署后端后，更新前端 API 地址：

### 开发环境
`client/.env.local`:
```
VITE_API_URL=http://localhost:5000
```

### 生产环境
`client/.env.production`:
```
VITE_API_URL=https://api.your-domain.com
```

### Capacitor 原生 App
`capacitor.config.ts` 中配置 `server.url` 或在代码中设置 `getApiBaseUrl()` 的返回值。

---

## 监控

```bash
# PM2 状态
pm2 status

# 查看日志
pm2 logs yanci-api

# 重启
pm2 restart yanci-api

# 资源占用
pm2 monit
```
