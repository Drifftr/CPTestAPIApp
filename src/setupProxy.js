const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests - match all API paths from OpenAPI spec
  // This will match paths like /orgs, /orgs/{orgName}/projects, /orgs/{orgName}/projects/{projectName}/components, etc.
  // Using explicit path matching to avoid intercepting React routes and static assets
  
  const apiProxy = createProxyMiddleware({
    target: 'http://development.wso2cloud-cp.preview-dv.choreoapis.dev',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    pathRewrite: (path, req) => {
      // Prepend the base path /platform-api-service/cpapi to the original path
      return `/platform-api-service/cpapi${path}`;
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying request:', req.method, req.url);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  });

  // Only apply proxy to specific API paths
  app.use('/orgs', apiProxy);
  app.use('/health', apiProxy);
  app.use('/ready', apiProxy);
  app.use('/apply', apiProxy);
  app.use('/delete', apiProxy);
};

