/**
 * oauth2_config.gs - OAuth2 Configuration for User-Scoped Access
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create OAuth 2.0 Client ID (Web application)
 * 3. Add authorized redirect URI: [Your Web App URL]
 * 4. Copy Client ID and Client Secret below
 * 5. Enable Google Drive API and Gmail API in the console
 */

const OAUTH2_CONFIG = {
  // TODO: Replace with your OAuth2 credentials from Google Cloud Console
  CLIENT_ID: PropertiesService.getScriptProperties().getProperty('OAUTH2_CLIENT_ID') || '',
  CLIENT_SECRET: PropertiesService.getScriptProperties().getProperty('OAUTH2_CLIENT_SECRET') || '',
  
  // OAuth2 endpoints
  AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  REVOKE_URL: 'https://oauth2.googleapis.com/revoke',
  
  // Scopes required for user data deletion
  SCOPES: [
    'https://www.googleapis.com/auth/drive',           // Full Drive access
    'https://www.googleapis.com/auth/gmail.modify',    // Gmail modify/delete
    'https://www.googleapis.com/auth/userinfo.email'   // User email identification
  ],
  
  // Token expiry buffer (refresh 5 minutes before expiry)
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000
};

/**
 * Setup function to store OAuth2 credentials
 * Run this once from the script editor after creating OAuth2 credentials
 */
function setupOAuth2Credentials() {
  const clientId = Browser.inputBox(
    'OAuth2 Setup',
    'Enter your OAuth2 Client ID:',
    Browser.Buttons.OK_CANCEL
  );
  
  if (clientId === 'cancel') {
    console.log('Setup cancelled');
    return;
  }
  
  const clientSecret = Browser.inputBox(
    'OAuth2 Setup',
    'Enter your OAuth2 Client Secret:',
    Browser.Buttons.OK_CANCEL
  );
  
  if (clientSecret === 'cancel') {
    console.log('Setup cancelled');
    return;
  }
  
  const props = PropertiesService.getScriptProperties();
  props.setProperty('OAUTH2_CLIENT_ID', clientId);
  props.setProperty('OAUTH2_CLIENT_SECRET', clientSecret);
  
  console.log('✅ OAuth2 credentials saved successfully!');
  console.log('Client ID: ' + clientId.substring(0, 20) + '...');
  
  // Display the redirect URI that needs to be registered
  const redirectUri = getAppUrl();
  console.log('\n📋 Add this Redirect URI to your OAuth2 credentials:');
  console.log(redirectUri);
  
  return {
    success: true,
    redirectUri: redirectUri
  };
}

/**
 * Get the full scope string for OAuth2 authorization
 */
function getOAuth2ScopeString() {
  return OAUTH2_CONFIG.SCOPES.join(' ');
}

/**
 * Verify OAuth2 configuration is complete
 */
function verifyOAuth2Config() {
  const clientId = OAUTH2_CONFIG.CLIENT_ID;
  const clientSecret = OAUTH2_CONFIG.CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('❌ OAuth2 credentials not configured!');
    console.log('Run setupOAuth2Credentials() to configure.');
    return false;
  }
  
  console.log('✅ OAuth2 configuration verified');
  console.log('Client ID: ' + clientId.substring(0, 20) + '...');
  console.log('Scopes: ' + OAUTH2_CONFIG.SCOPES.length + ' scopes configured');
  return true;
}
