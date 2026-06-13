const localtunnel = require('localtunnel');
(async () => {
  const tunnel = await localtunnel({ port: 3001, subdomain: 'githubfs-nied' });
  console.log('github-file-server tunnel: ' + tunnel.url);
  tunnel.on('close', () => console.log('Tunnel closed'));
})();
