/**
 * auth.gs - Security & Session Management (Refactored for USER_DEPLOYING)
 */

// Helper to get CANONICAL script URL (fixes domain/multi-account issues)
// Helper to get Web App URL (handles dev/exec and canonical needs)
function getAppUrl(defaultUrl = "") {
  // Use a stored property if set, otherwise use the current service URL
  const props = PropertiesService.getScriptProperties();
  let url = props.getProperty('CANONICAL_URL');
  
  if (!url) {
    url = ScriptApp.getService().getUrl();
  }
  
  // Cleanup trailing slash
  if (url && url.endsWith('/')) url = url.slice(0, -1);
  return url;
}

/**
 * DEBUG: Run this to lock in the current URL as Canonical
 */
function debugSetCanonicalUrl() {
  const url = ScriptApp.getService().getUrl();
  PropertiesService.getScriptProperties().setProperty('CANONICAL_URL', url);
  console.log("✅ CANONICAL_URL set to: " + url);
  return url;
}

// ============================================
// 1. Authentication & Session Management
// ============================================

/**
 * Authenticates user with email and password.
 */
function authenticateUser(password) {
  const userEmail = getUserEmail();
  if (userEmail === "Anonymous") {
    return { success: false, message: "Googleアカウントにログインしてください" };
  }

  const user = DB.getUser(userEmail);

  // First time setup for this specific user
  if (!user || !user.hashed_password) {
    if (!password || password.length < 6) {
      return { success: false, message: 'パスワードは6文字以上で設定してください' };
    }
    
    // Create or update user
    const newUser = {
      email: userEmail,
      hashed_password: password, // Simple for now, should salt/hash later
      created_at: new Date()
    };
    DB.saveUser(newUser);
    
    const token = generateAdminToken(userEmail);
    const baseUrl = getAppUrl("");
    const redirectUrl = baseUrl ? (baseUrl + "?session=" + token) : ("?session=" + token);
    return { success: true, sessionToken: token, redirectUrl: redirectUrl };
  }
  
  // Verify password
  if (password !== user.hashed_password) {
    return { success: false, message: "パスワードが正しくありません" };
  }

  const token = generateAdminToken(userEmail);
  const baseUrl = getAppUrl("");
  const redirectUrl = baseUrl ? (baseUrl + "?session=" + token) : ("?session=" + token);
  return { success: true, sessionToken: token, redirectUrl: redirectUrl };
}

/**
 * Generates and saves a session token for a specific user.
 */
function generateAdminToken(email) {
  const token = Utilities.getUuid();
  const expiryTime = new Date(new Date().getTime() + (24 * 60 * 60 * 1000)); // 24 hours
  
  DB.saveSession(token, email, expiryTime);
  return token;
}

/**
 * Validates the session token from DB.
 */
function validateAdminSession(token) {
  if (!token) return false;
  const session = DB.getSession(token);
  if (!session) return false;
  
  const now = new Date();
  if (new Date(session.expires_at) < now) {
    DB.deleteSession(token);
    return false;
  }
  
  return true;
}

/**
 * Endpoint for SPA to check status.
 */
function getAuthStatus(sessionToken) {
  const isValid = validateAdminSession(sessionToken);
  const userEmail = getUserEmail();
  
  let user = null;
  if (userEmail !== "Anonymous") {
    user = DB.getUser(userEmail);
  }

  const isFirstTime = !user || !user.hashed_password;
  const permissions = checkPermissions();
  
  let sessionUserEmail = "Anonymous";
  if (isValid) {
    const session = DB.getSession(sessionToken);
    sessionUserEmail = session ? session.user_email : "Anonymous";
  }

  return {
    authenticated: isValid,
    userEmail: userEmail,
    sessionUserEmail: sessionUserEmail,
    isFirstTime: isFirstTime,
    permissions: permissions,
    canonicalUrl: getAppUrl()
  };
}

/**
 * Specifically for polling the current user status.
 */
function getActiveUserEmail() {
  const email = getUserEmail();
  return {
    email: email
  };
}

/**
 * Robust email getter
 */
function getUserEmail() {
  try {
    const email = Session.getActiveUser().getEmail();
    if (email && email !== "Anonymous") return email;
    
    // Fallback or handle restricted context
    return "Anonymous";
  } catch (e) {
    return "Anonymous";
  }
}

/**
 * Logout
 */
function logout() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('ADMIN_SESSION_TOKEN');
  props.deleteProperty('ADMIN_SESSION_EXPIRY');
  return { success: true, redirectUrl: getAppUrl() };
}


// ============================================
// 2. LINE Login Helpers (Stateless / Session params)
// ============================================

/**
 * Returns the LINE Login URL.
 */
function getLoginUrl(forceLogin, sessionToken) {
  const redirectUri = getAppUrl(""); 
  console.log("LINE Login: Using redirect_uri = " + redirectUri);
  
  // We pack the session token into the state to identify the user on callback
  const state = sessionToken || "GUEST_" + Math.random().toString(36).substring(7);
  
  let url = "https://access.line.me/oauth2/v2.1/authorize?" +
    "response_type=code" +
    "&client_id=" + CONFIG.LINE_CLIENT_ID +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&state=" + encodeURIComponent(state) +
    "&scope=profile%20openid";
  
  if (forceLogin) url += "&prompt=login";
  return url;
}

/**
 * Handles the OAuth callback.
 */
function handleAuthCallback(code, state) {
  const redirectUri = getAppUrl(""); // Use canonical Project URL for stability
  const payload = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: CONFIG.LINE_CLIENT_ID,
    client_secret: CONFIG.LINE_CLIENT_SECRET
  };

  try {
    const response = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'post',
      payload: payload
    });
    const data = JSON.parse(response.getContentText());
    const lineUserId = getUserIdFromProfile(data.access_token);
    
    // Identify user by state (session token)
    const session = DB.getSession(state);
    if (session) {
      const user = DB.getUser(session.user_email);
      if (user) {
        user.line_id = lineUserId;
        DB.saveUser(user);
      }
    }
    
    return createSuccessPage(lineUserId);

  } catch (e) {
    return createErrorPage(e.message);
  }
}

function getUserIdFromProfile(accessToken) {
  const response = UrlFetchApp.fetch('https://api.line.me/v2/profile', {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  return JSON.parse(response.getContentText()).userId;
}

function createSuccessPage(userId) {
  const systemUrl = getAppUrl("");
  return HtmlService.createHtmlOutput(`
    <div style="font-family:sans-serif; text-align:center; padding:2rem;">
      <h1>✅ LINE連携完了</h1>
      <p>ID: ${userId}</p>
      <a href="${systemUrl}" target="_top" style="background:#06C755; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block; margin-top:1rem;">戻る</a>
    </div>
  `);
}

function createErrorPage(msg) {
  const systemUrl = getAppUrl("");
  return HtmlService.createHtmlOutput(`
    <div style="font-family:sans-serif; text-align:center; padding:2rem; color:red;">
      <h1>❌ 連携失敗</h1>
      <p>${msg}</p>
      <a href="${systemUrl}" target="_top" style="display:inline-block; margin-top:1rem;">戻る</a>
    </div>
  `);
}

/**
 * Disconnects LINE (Secure).
 */
function disconnectLineAccount(token) {
  const session = DB.getSession(token);
  if (!session) throw new Error("Unauthorized");
  
  const user = DB.getUser(session.user_email);
  if (user) {
    user.line_id = "";
    DB.saveUser(user);
    console.log(`LINE account disconnected for: ${session.user_email}`);
    return { success: true, message: "LINE連携を解除しました" };
  }
  return { success: false, message: "ユーザーが見つかりません" };
}

/**
 * DEBUG: Manually disconnect a user by email
 */
function debugDisconnectUser(email) {
  const user = DB.getUser(email);
  if (user) {
    user.line_id = "";
    DB.saveUser(user);
    console.log(`✅ DEBUG: Manually disconnected LINE for: ${email}`);
    return "Disconnected: " + email;
  }
  return "User not found: " + email;
}

/**
 * Diagnostic helper to check what the script can access.
 */
function checkPermissions() {
  const results = {};
  try { results.Properties = !!PropertiesService.getScriptProperties(); } catch(e) { results.Properties = e.message; }
  try { results.ActiveUser = Session.getActiveUser().getEmail() || "Anonymous"; } catch(e) { results.ActiveUser = e.message; }
  try { results.EffectiveUser = Session.getEffectiveUser().getEmail(); } catch(e) { results.EffectiveUser = e.message; }
  try { results.Drive = !!DriveApp.getRootFolder(); } catch(e) { results.Drive = e.message; }
  return results;
}

