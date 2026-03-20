const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const ocApiProxy = createProxyMiddleware({
    target: 'http://development-wso2cloud.openchoreoapis.localhost:19080',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    pathRewrite: (path) => {
      const rewritten = path.replace(/^\/oc-api/, '/platform-api-service-platform-api-endpoint');
      console.log('[proxy] API:', path, '→', rewritten);
      return rewritten;
    },
    onError: (err, req, res) => {
      console.error('[proxy] API error:', err);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  });

  app.use('/oc-api', ocApiProxy);
};
