/**
 * auth.gs - LINE Login OAuth2 Logic
 */

/**
 * Returns the LINE Login URL.
 */
function getLoginUrl() {
  const redirectUri = ScriptApp.getService().getUrl();
  const state = Math.random().toString(36).substring(7);
  
  // Temporarily store state in user properties to prevent CSRF
  PropertiesService.getUserProperties().setProperty('oauth_state', state);

  const url = "https://access.line.me/oauth2/v2.1/authorize?" +
    "response_type=code" +
    "&client_id=" + CONFIG.LINE_CLIENT_ID +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&state=" + state +
    "&scope=profile%20openid";
  
  return url;
}

/**
 * Handles the OAuth callback and exchanges code for token/ID.
 */
function handleAuthCallback(code) {
  const redirectUri = ScriptApp.getService().getUrl();
  
  const payload = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: CONFIG.LINE_CLIENT_ID,
    client_secret: CONFIG.LINE_CLIENT_SECRET
  };

  const options = {
    method: 'post',
    payload: payload
  };

  try {
    const response = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/token', options);
    const data = JSON.parse(response.getContentText());
    
    // ID Token from LINE contains the userId
    // However, the easiest way to get userId is from the profile API with the access token
    const userId = getUserIdFromProfile(data.access_token);
    
    // Save to Script Properties
    PropertiesService.getScriptProperties().setProperty('USER_LINE_ID', userId);
    
    // Show success page with return button
    return createSuccessPage(userId);

  } catch (e) {
    return createErrorPage(e.message);
  }
}

/**
 * Fetches user profile to get the persistent userId.
 */
function getUserIdFromProfile(accessToken) {
  const options = {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  };
  const response = UrlFetchApp.fetch('https://api.line.me/v2/profile', options);
  const profile = JSON.parse(response.getContentText());
  return profile.userId;
}

/**
 * Creates a success page after LINE login
 */
function createSuccessPage(userId) {
  const systemUrl = ScriptApp.getService().getUrl();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LINE連携成功</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Outfit', sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f8fafc;
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .container {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 1.75rem;
          margin: 0 0 1rem 0;
          color: #4ade80;
        }
        p {
          color: #94a3b8;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        .user-id {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 2rem;
          font-family: monospace;
          font-size: 0.9rem;
          word-break: break-all;
        }
        .btn {
          background: #06C755;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .btn:hover {
          background: #05b34c;
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>LINE連携が完了しました!</h1>
        <p>あなたのLINEアカウントが正常に登録されました。</p>
        <div class="user-id">
          <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.5rem;">登録されたLINE ID</div>
          ${userId}
        </div>
        <a href="${systemUrl}" class="btn">
          🏠 システム画面に戻る
        </a>
      </div>
    </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html);
}

/**
 * Creates an error page when LINE login fails
 */
function createErrorPage(errorMessage) {
  const systemUrl = ScriptApp.getService().getUrl();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LINE連携エラー</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Outfit', sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f8fafc;
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .container {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 1.75rem;
          margin: 0 0 1rem 0;
          color: #ef4444;
        }
        p {
          color: #94a3b8;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 2rem;
          font-size: 0.9rem;
          color: #fca5a5;
        }
        .btn {
          background: #38bdf8;
          color: #0f172a;
          border: none;
          border-radius: 12px;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>LINE連携に失敗しました</h1>
        <p>認証処理中にエラーが発生しました。もう一度お試しください。</p>
        <div class="error-message">
          ${errorMessage}
        </div>
        <a href="${systemUrl}" class="btn">
          🏠 システム画面に戻る
        </a>
      </div>
    </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html);
}

// ============================================
// Password Authentication & Session Management
// ============================================

/**
 * Authenticates user with password
 * @param {string} password - Password to verify
 * @returns {Object} - Result with success status and redirect URL
 */
function authenticateUser(password) {
  const props = PropertiesService.getScriptProperties();
  const userEmail = Session.getActiveUser().getEmail();
  
  // Check if this is first time setup
  const storedPassword = props.getProperty('ADMIN_PASSWORD');
  
  if (!storedPassword) {
    // First time setup - set password and lock account
    if (!password || password.length < 6) {
      return {
        success: false,
        message: 'パスワードは6文字以上で設定してください'
      };
    }
    
    props.setProperty('ADMIN_PASSWORD', password);
    props.setProperty('LOCKED_ACCOUNT', userEmail);
    
    // Generate session token
    const sessionToken = generateSessionToken();
    const redirectUrl = ScriptApp.getService().getUrl() + '?session=' + sessionToken;
    
    return {
      success: true,
      redirectUrl: redirectUrl
    };
  }
  
  // Verify password first
  if (password !== storedPassword) {
    return {
      success: false,
      message: 'パスワードが正しくありません'
    };
  }

  // Password is correct. Check if we need to update the locked account.
  const lockedAccount = props.getProperty('LOCKED_ACCOUNT');
  if (lockedAccount && lockedAccount !== userEmail) {
    // Audit log or property update
    console.warn(`Account switched from ${lockedAccount} to ${userEmail}`);
    props.setProperty('LOCKED_ACCOUNT', userEmail);
  }
  
  // Generate session token
  const sessionToken = generateSessionToken();
  const redirectUrl = ScriptApp.getService().getUrl() + '?session=' + sessionToken;
  
  return {
    success: true,
    redirectUrl: redirectUrl
  };
}

/**
 * Generates a session token and stores it
 * @returns {string} - Session token
 */
function generateSessionToken() {
  const token = Utilities.getUuid();
  const userEmail = Session.getActiveUser().getEmail();
  const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
  
  const userProps = PropertiesService.getUserProperties();
  userProps.setProperty('SESSION_TOKEN', token);
  userProps.setProperty('SESSION_EXPIRY', expiryTime.toString());
  userProps.setProperty('SESSION_EMAIL', userEmail);
  
  return token;
}

/**
 * Validates a session token
 * @param {string} token - Session token to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidSession(token) {
  if (!token) return false;
  
  const userProps = PropertiesService.getUserProperties();
  const storedToken = userProps.getProperty('SESSION_TOKEN');
  const expiryTime = userProps.getProperty('SESSION_EXPIRY');
  const sessionEmail = userProps.getProperty('SESSION_EMAIL');
  const currentEmail = Session.getActiveUser().getEmail();
  
  // Check if token matches
  if (token !== storedToken) return false;
  
  // Check if session expired
  if (!expiryTime || new Date().getTime() > parseInt(expiryTime)) {
    clearSession();
    return false;
  }
  
  // Check if email matches (prevent session hijacking)
  if (sessionEmail !== currentEmail) {
    clearSession();
    return false;
  }
  
  return true;
}

/**
 * Clears the current session
 */
function clearSession() {
  const userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty('SESSION_TOKEN');
  userProps.deleteProperty('SESSION_EXPIRY');
  userProps.deleteProperty('SESSION_EMAIL');
}

/**
 * Returns the currently active user's email.
 * Used for client-side polling to detect account changes.
 */
function getActiveUserEmail() {
  const email = Session.getActiveUser().getEmail();
  const props = PropertiesService.getScriptProperties();
  const lockedAccount = props.getProperty('LOCKED_ACCOUNT');
  const isFirstTime = !props.getProperty('ADMIN_PASSWORD');
  
  return {
    email: email,
    lockedAccount: lockedAccount,
    isFirstTime: isFirstTime,
    accountMismatch: lockedAccount && lockedAccount !== email
  };
}

/**
 * Logs out the user
 * @returns {Object} - Redirect URL
 */
function logout() {
  clearSession();
  return {
    success: true,
    redirectUrl: ScriptApp.getService().getUrl()
  };
}
