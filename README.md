# GitHub File Server

📦 HTTP file server powered by GitHub repository storage. Upload, browse, and download files via a clean web interface, with all files stored directly in a GitHub repo.

## Features

- ⬆ **Upload files** via web UI or curl (`POST /upload`)
- 📂 **Browse files** with file size, type icons
- ⬇ **Download** any file (`GET /files/:name`)
- 👁 **Inline preview** for text files (`GET /raw/:name`)
- 🏥 **Health check** endpoint (`GET /health`)
- 🎨 GitHub-style dark theme UI
- 📁 Optional subdirectory uploads

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Originalprinci/github-file-server.git
cd github-file-server

# 2. Install
npm install

# 3. Set your token
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxx"   # PowerShell
# export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"  # Linux/macOS

# 4. Run
npm start
```

Open http://localhost:3000

## API

### Upload files

```bash
# Upload a single file
curl -F "files=@photo.jpg" http://localhost:3000/upload

# Upload to a subdirectory
curl -F "files=@photo.jpg" -F "dir=images" http://localhost:3000/upload

# Upload multiple files
curl -F "files=@a.txt" -F "files=@b.txt" http://localhost:3000/upload
```

### Download files

```bash
curl -O http://localhost:3000/files/photo.jpg
```

### Health check

```bash
curl http://localhost:3000/health
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | *required* | GitHub Personal Access Token (needs `repo` scope) |
| `GITHUB_OWNER` | `Originalprinci` | GitHub username/org |
| `GITHUB_REPO` | `github-file-server` | Repository name |
| `GITHUB_BRANCH` | `main` | Branch to use |
| `PORT` | `3000` | HTTP server port |

## Deploy

This is a simple Express app. You can deploy it anywhere:

- **Vercel**: Just import the repo
- **PM2**: `pm2 start server.js --name github-file-server`
- **Docker**: `docker run -e GITHUB_TOKEN=... -p 3000:3000 ...`

## License

MIT
