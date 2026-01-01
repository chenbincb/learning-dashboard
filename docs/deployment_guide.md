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

# 配置环境变量 (AI 功能必需)
# 创建 .env.local 文件并填入 GEMINI_API_KEY
echo "GEMINI_API_KEY=AIzaSy..." > .env.local

# 安装依赖
npm install

# 初始化数据库结构 (包含 AI 诊断表)
npm run db:init

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

### 1. Zeabur (推荐 - 简单灵活)
Zeabur 是部署本项目非常理想的选择，支持代码全自动构建和多种同步方式。

**方案 A：Git 同步模式 (推荐 - 适用于数据相对稳定的场景)**
如果您主要在本地开发环境导入数据（得到最新的 `scores.db`），并通过 Git 提交同步，则**无需配置持久化卷**。
1.  **提交数据**：确保 `data/scores.db` 未被 `.gitignore` 忽略，并在本地导入数据后进行提交。
2.  **自动部署**：Zeabur 会在您提交代码后自动重新构建服务。
3.  **优势**：无需额外配置，利用 Git 记录数据版本，简单可靠。

**方案 B：持久化卷模式 (适用于需要在线导入数据的场景)**
如果您希望直接在线上环境导入并保存数据，需要配置持久化卷：
1.  **连接 GitHub**：在 Zeabur 控制台关联代码仓库。
2.  **配置持久化卷 (关键)**：
    -   在服务页面点击 **"Resources" (资源)** 标签。
    -   点击 **"Add Volume"**。
    -   **Mount Path (挂载路径)**：需填写 `/src/data` （Zeabur 默认运行目录在 `/src`）。
    -   **注意**：新挂载的卷默认是空的，会覆盖镜像自带的数据库。您需要在挂载后，通过 Zeabur 的“文件管理器”手动将本地的 `scores.db` 上传到该目录下。
3.  **优点**：支持在线写入，数据不会随部署丢失。

### 2.1 Zeabur 环境变量配置 (关键)
在 Zeabur 控制台的服务设置中，请务必添加：
- **GEMINI_API_KEY**: `您的密钥`

如果您是首次部署，可以在 Zeabur 的 "Shell" 或 "Command" 中手动运行一次 `npm run db:init` 以确保数据库结构完整。

- 优点：一键部署，自动配置 SSL (HTTPS)，支持 Git 直接管理数据。
- 缺点：免费额度适合个人使用，大规模需升级。

### 2. 为什么不直接用 Vercel?
Vercel 是 Serverless 环境，文件系统是只读且非持久的。如果你部署到 Vercel，执行导入数据后，数据库文件会在几分钟后重置。如果坚持要用 Vercel，必须将会 SQLite 替换为腾讯云/阿里云的数据库服务（如 PostgreSQL 或 MySQL）。

---

## 关键注意事项

1.  **数据库备份**：定期导出或备份项目根目录下的 `scores.db` 文件。
2.  **环境变量**：如果在本地有 `.env` 文件，请记得在服务器上也手动创建或设置对应的环境变量。
3.  **内网穿透 (仅供测试)**：如果你只是想从自己电脑临时展示给外网看，可以使用 `cloudflared` 或 `ngrok`。
