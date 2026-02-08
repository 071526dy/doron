/**
 * oauth2_callback.gs - OAuth2 Callback Handler
 * Handles the OAuth2 callback from Google authorization
 */

/**
 * Handle OAuth2 callback and exchange code for tokens
 */
function handleOAuth2Callback(code, state) {
  try {
    // Parse state to get user email and session
    const stateData = JSON.parse(decodeURIComponent(state));
    const userEmail = stateData.email;
    const sessionToken = stateData.session;
    
    console.log('Processing OAuth2 callback for: ' + userEmail);
    
    // Exchange code for tokens
    const tokens = exchangeCodeForTokens(code);
    
    if (!tokens || !tokens.access_token) {
      throw new Error('Failed to obtain access token');
    }
    
    // Calculate token expiry time
    const expiryTime = new Date(new Date().getTime() + (tokens.expires_in * 1000));
    
    // Save tokens to database
    DB.saveUserToken(userEmail, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: expiryTime,
      scopes_granted: tokens.scope,
      created_at: new Date()
    });
    
    console.log('✅ OAuth2 tokens saved for: ' + userEmail);
    
    // Redirect back to app with session
    const redirectUrl = getAppUrl() + '?session=' + sessionToken + '&oauth=success';
    
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>認証完了</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #667eea; margin-bottom: 1rem; }
            p { color: #666; margin-bottom: 1.5rem; }
            .spinner {
              border: 3px solid #f3f3f3;
              border-top: 3px solid #667eea;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ 認証完了</h1>
            <p>Googleアカウントへのアクセスを許可しました。<br>アプリに戻っています...</p>
            <div class="spinner"></div>
          </div>
          <script>
            setTimeout(function() {
              window.top.location.href = '${redirectUrl}';
            }, 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (e) {
    console.error('OAuth2 callback error: ' + e.message);
    
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>認証エラー</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 12px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #f5576c; margin-bottom: 1rem; }
            p { color: #666; margin-bottom: 1.5rem; }
            button {
              background: #f5576c;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover { background: #e04858; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ 認証エラー</h1>
            <p>Google認証に失敗しました。<br>${e.message}</p>
            <button onclick="window.top.location.href='${getAppUrl()}'">アプリに戻る</button>
          </div>
        </body>
      </html>
    `);
  }
}
