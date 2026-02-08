/**
 * oauth2_service.gs - OAuth2 Token Management Service
 * Handles token exchange, refresh, and storage
 */

/**
 * Generate OAuth2 authorization URL for user consent
 */
function getOAuth2AuthorizationUrl(userEmail, sessionToken) {
  if (!OAUTH2_CONFIG.CLIENT_ID) {
    throw new Error('OAuth2 not configured. Run setupOAuth2Credentials() first.');
  }
  
  const redirectUri = getAppUrl();
  const state = encodeURIComponent(JSON.stringify({
    email: userEmail,
    session: sessionToken,
    timestamp: new Date().getTime()
  }));
  
  const params = {
    client_id: OAUTH2_CONFIG.CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: getOAuth2ScopeString(),
    access_type: 'offline',  // Request refresh token
    prompt: 'consent',       // Force consent screen to get refresh token
    state: state
  };
  
  const queryString = Object.keys(params)
    .map(key => key + '=' + encodeURIComponent(params[key]))
    .join('&');
  
  return OAUTH2_CONFIG.AUTH_URL + '?' + queryString;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
function exchangeCodeForTokens(code) {
  const redirectUri = getAppUrl();
  
  const payload = {
    code: code,
    client_id: OAUTH2_CONFIG.CLIENT_ID,
    client_secret: OAUTH2_CONFIG.CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(OAUTH2_CONFIG.TOKEN_URL, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      console.error('Token exchange error: ' + result.error_description);
      throw new Error('Failed to exchange code for tokens: ' + result.error);
    }
    
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
      scope: result.scope,
      token_type: result.token_type
    };
  } catch (e) {
    console.error('Token exchange failed: ' + e.message);
    throw e;
  }
}

/**
 * Refresh an expired access token using refresh token
 */
function refreshAccessToken(refreshToken) {
  const payload = {
    client_id: OAUTH2_CONFIG.CLIENT_ID,
    client_secret: OAUTH2_CONFIG.CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(OAUTH2_CONFIG.TOKEN_URL, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      console.error('Token refresh error: ' + result.error_description);
      throw new Error('Failed to refresh token: ' + result.error);
    }
    
    return {
      access_token: result.access_token,
      expires_in: result.expires_in,
      scope: result.scope,
      token_type: result.token_type
    };
  } catch (e) {
    console.error('Token refresh failed: ' + e.message);
    throw e;
  }
}

/**
 * Revoke user's OAuth2 tokens
 */
function revokeOAuth2Token(token) {
  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: { token: token },
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(OAUTH2_CONFIG.REVOKE_URL, options);
    console.log('✅ Token revoked successfully');
    return true;
  } catch (e) {
    console.error('Token revocation failed: ' + e.message);
    return false;
  }
}

/**
 * Get valid access token for user (refresh if needed)
 */
function getValidAccessToken(userEmail) {
  const tokenData = DB.getUserToken(userEmail);
  
  if (!tokenData) {
    throw new Error('No OAuth2 token found for user. Authorization required.');
  }
  
  // Check if token is expired or about to expire
  const now = new Date().getTime();
  const expiryTime = new Date(tokenData.token_expiry).getTime();
  
  if (now >= expiryTime - OAUTH2_CONFIG.TOKEN_EXPIRY_BUFFER) {
    console.log('Token expired or expiring soon, refreshing...');
    
    // Refresh the token
    const newTokens = refreshAccessToken(tokenData.refresh_token);
    
    // Update stored token
    const newExpiryTime = new Date(now + (newTokens.expires_in * 1000));
    DB.saveUserToken(userEmail, {
      access_token: newTokens.access_token,
      refresh_token: tokenData.refresh_token, // Keep existing refresh token
      token_expiry: newExpiryTime,
      scopes_granted: newTokens.scope
    });
    
    return newTokens.access_token;
  }
  
  return tokenData.access_token;
}

/**
 * Check if user has valid OAuth2 authorization
 */
function isUserAuthorized(userEmail) {
  const tokenData = DB.getUserToken(userEmail);
  return tokenData && tokenData.access_token && tokenData.refresh_token;
}
