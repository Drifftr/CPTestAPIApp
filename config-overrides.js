// Webpack override to fix ESM fullySpecified resolution for @wso2/oxygen-ui.
// CRA 5 (Webpack 5) requires fully specified imports for ESM modules,
// but oxygen-ui imports prismjs without .js extensions.
module.exports = function override(config) {
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });
  return config;
};
