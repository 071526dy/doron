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
    
    // Redirect back to the UI
    const url = ScriptApp.getService().getUrl() + "?status=success";
    return HtmlService.createHtmlOutput("<script>window.top.location.href='" + url + "';</script>");

  } catch (e) {
    return HtmlService.createHtmlOutput("Error: " + e.message);
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
