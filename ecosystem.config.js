module.exports = {
  apps: [{
    name: 'github-file-server',
    script: 'server.js',
    cwd: 'C:/Users/Administrator/clawd/github-file-server',
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE',
      GITHUB_OWNER: 'Originalprinci',
      GITHUB_REPO: 'github-file-server',
      GITHUB_BRANCH: 'main',
      PORT: 3001
    }
  }]
};
