# 部署上线指南 (Deployment Guide)

本项目使用 **Next.js** 开发，并使用 **SQLite (better-sqlite3)** 作为数据库。由于 SQLite 是基于本地文件的数据库，建议使用 **VPS (虚拟机/云服务器)** 进行部署，以确保数据的持久化。

---

## 方案一：云服务器 (VPS) 部署 (推荐)

这是最传统且灵活的方式，适用于阿里云、腾讯云、华为云、AWS、DigitalOcean 等。

### 1. 环境准备
在服务器（建议使用 Ubuntu 20.04+）上安装必要环境：
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (建议使用 nvm 安装 LTS 版本)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts

# 安装 Git
sudo apt install git -y

# 安装 PM2 (用于保持项目常驻运行)
npm install pm2 -g
```

### 2. 获取代码与编译
```bash
# 克隆代码
git clone <你的项目地址>
cd <项目目录>

# 安装依赖
npm install

# 编译生成生产环境代码
npm run build
```

### 3. 使用 PM2 启动项目
```bash
# 启动项目并命名为 exam-platform
pm2 start npm --name "exam-platform" -- start

# 设置开机自启
pm2 save
pm2 startup
```

### 4. 配置 Nginx 与 反向代理
为了让外网通过 `http://你的域名` 或 `http://IP` 直接访问（无需输入 :3000 端口），需要配置 Nginx：

```bash
sudo apt install nginx -y
```

编辑 Nginx 配置：
```nginx
server {
    listen 80;
    server_name 你的域名或外网IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 方案二：PaaS 平台 (简便但需配置)

如果你不想折腾 Nginx 和 Linux 系统，可以使用以下平台：

### 1. Zeabur / Railway / Render
这些平台支持 **Persistent Volume (持久卷)**，可以将 `scores.db` 挂载到持久存储中，这样每次重新部署数据不会丢失。
- 优点：一键部署，自动配置 SSL (HTTPS)。
- 缺点：免费额度有限，且配置持久化卷需要稍微研究一下。

### 2. 为什么不直接用 Vercel?
Vercel 是 Serverless 环境，文件系统是只读且非持久的。如果你部署到 Vercel，执行导入数据后，数据库文件会在几分钟后重置。如果坚持要用 Vercel，必须将会 SQLite 替换为腾讯云/阿里云的数据库服务（如 PostgreSQL 或 MySQL）。

---

## 关键注意事项

1.  **数据库备份**：定期导出或备份项目根目录下的 `scores.db` 文件。
2.  **环境变量**：如果在本地有 `.env` 文件，请记得在服务器上也手动创建或设置对应的环境变量。
3.  **内网穿透 (仅供测试)**：如果你只是想从自己电脑临时展示给外网看，可以使用 `cloudflared` 或 `ngrok`。
