const env = {
  THUNDER_URL: process.env.REACT_APP_THUNDER_URL || 'https://platform-idp.127.0.0.1.nip.io:19080',
  THUNDER_CLIENT_ID: process.env.REACT_APP_THUNDER_CLIENT_ID || 'CLOUD_CONSOLE',
  THUNDER_SCOPES: (process.env.REACT_APP_THUNDER_SCOPES || 'openid profile email').split(' '),
  SIGN_IN_REDIRECT_URL: process.env.REACT_APP_SIGN_IN_REDIRECT_URL || 'http://localhost:3000',
  SIGN_OUT_REDIRECT_URL: process.env.REACT_APP_SIGN_OUT_REDIRECT_URL || 'http://localhost:3000',
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || '',
  DEV_BYPASS_AUTH: process.env.REACT_APP_DEV_BYPASS_AUTH === 'true',
};

export default env;
