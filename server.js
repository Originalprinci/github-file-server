const express = require('express');
const multer = require('multer');
const { Octokit } = require('@octokit/rest');
const path = require('path');
const fs = require('fs');

// ── Config ──
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Originalprinci';
const GITHUB_REPO = process.env.GITHUB_REPO || 'github-file-server';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ── Express setup ──
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Helpers ──
function base64Encode(content) {
  return Buffer.from(content).toString('base64');
}

function base64Decode(content) {
  return Buffer.from(content, 'base64').toString('utf-8');
}

// Get file list from repo root
async function getFileList(dirPath = '') {
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: dirPath,
      ref: GITHUB_BRANCH,
    });

    const items = Array.isArray(data) ? data : [data];
    return items
      .filter(item => item.type === 'file')
      .map(item => ({
        name: item.name,
        path: item.path,
        size: item.size,
        sha: item.sha,
        html_url: item.html_url,
        download_url: `/files/${encodeURIComponent(item.path)}`,
      }));
  } catch (err) {
    if (err.status === 404) {
      return [];
    }
    throw err;
  }
}

// ── Routes ──

// Home - file browser
app.get('/', async (req, res) => {
  try {
    const files = await getFileList();
    const repoInfo = {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
    };
    res.render('index', { files, repoInfo, error: null, host: req.get('host'), protocol: req.protocol });
  } catch (err) {
    console.error('Error listing files:', err.message);
    res.render('index', { files: [], repoInfo: {}, error: err.message });
  }
});

// Download a file
app.get('/files/:filename', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filename);
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      ref: GITHUB_BRANCH,
    });

    if (data.type !== 'file') {
      return res.status(400).send('Not a file');
    }

    const content = base64Decode(data.content);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
    };

    res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${data.name}"`);
    res.send(Buffer.from(data.content, 'base64'));
  } catch (err) {
    console.error('Error downloading file:', err.message);
    if (err.status === 404) {
      return res.status(404).send('File not found');
    }
    res.status(500).send('Download failed: ' + err.message);
  }
});

// Raw view (inline instead of download)
app.get('/raw/:filename', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filename);
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      ref: GITHUB_BRANCH,
    });

    if (data.type !== 'file') {
      return res.status(400).send('Not a file');
    }

    const content = Buffer.from(data.content, 'base64');
    const ext = path.extname(filePath).toLowerCase();
    const textTypes = ['.txt', '.html', '.css', '.js', '.json', '.md', '.xml', '.csv', '.yml', '.yaml'];
    
    if (textTypes.includes(ext)) {
      res.set('Content-Type', 'text/plain; charset=utf-8');
    } else {
      res.set('Content-Type', 'application/octet-stream');
    }
    res.send(content);
  } catch (err) {
    res.status(404).send('File not found');
  }
});

// Upload page
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Upload files (API)
app.post('/upload', upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const targetDir = req.body.dir || '';
  const results = [];

  for (const file of req.files) {
    try {
      const filePath = targetDir
        ? `${targetDir.replace(/\/+$/, '')}/${file.originalname}`
        : file.originalname;

      const content = base64Encode(file.buffer);

      // Check if file exists (for sha)
      let sha = null;
      try {
        const { data } = await octokit.repos.getContent({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: filePath,
          ref: GITHUB_BRANCH,
        });
        sha = data.sha;
      } catch (e) {
        // File doesn't exist yet - that's fine
      }

      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: filePath,
        message: `Upload: ${file.originalname}`,
        content,
        branch: GITHUB_BRANCH,
        sha,
      });

      results.push({
        name: file.originalname,
        path: filePath,
        size: file.size,
        status: 'uploaded',
      });
    } catch (err) {
      results.push({
        name: file.originalname,
        status: 'failed',
        error: err.message,
      });
    }
  }

  const allOk = results.every(r => r.status === 'uploaded');
  res.status(allOk ? 200 : 207).json({
    message: `${results.filter(r => r.status === 'uploaded').length}/${results.length} files uploaded`,
    files: results,
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', repo: `${GITHUB_OWNER}/${GITHUB_REPO}`, branch: GITHUB_BRANCH });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`🚀 GitHub File Server running on http://localhost:${PORT}`);
  console.log(`📦 Repo: ${GITHUB_OWNER}/${GITHUB_REPO} (${GITHUB_BRANCH})`);
});
