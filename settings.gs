/**
 * settings.gs - Handles persistence of system configuration.
 */

/**
 * Saves all settings passed from the frontend.
 * @param {Object} data Settings data object.
 */
function saveSettings(data) {
  const props = PropertiesService.getScriptProperties();
  
  if (data.passkey) props.setProperty('PASSKEY', data.passkey);
  if (data.keymanLineId) props.setProperty('KEYMAN_LINE_ID', data.keymanLineId);
  if (data.gracePeriodHours) props.setProperty('GRACE_PERIOD_HOURS', data.gracePeriodHours);
  if (data.macrodroidWebhookUrl) props.setProperty('MACRODROID_WEBHOOK_URL', data.macrodroidWebhookUrl);
  if (data.lastMessages) props.setProperty('LAST_MESSAGES', JSON.stringify(data.lastMessages));
  
  // Optional: Settings for API tokens if entered
  if (data.lineAccessToken) props.setProperty('LINE_ACCESS_TOKEN', data.lineAccessToken);
  if (data.lineClientId) props.setProperty('LINE_CLIENT_ID', data.lineClientId);
  if (data.lineClientSecret) props.setProperty('LINE_CLIENT_SECRET', data.lineClientSecret);

  return { success: true, message: "設定を保存しました。" };
}

/**
 * Retrieves current settings for the frontend.
 */
function getSettings() {
  return {
    passkey: CONFIG.PASSKEY,
    keymanLineId: CONFIG.KEYMAN_LINE_ID,
    gracePeriodHours: parseInt(PropertiesService.getScriptProperties().getProperty('GRACE_PERIOD_HOURS')) || 24,
    macrodroidWebhookUrl: CONFIG.MACRODROID_WEBHOOK_URL,
    lastMessages: CONFIG.LAST_MESSAGES,
    userLineId: CONFIG.USER_LINE_ID,
    userEmail: CONFIG.USER_EMAIL,
    // Add tokens for setup if they are still the default
    lineAccessToken: CONFIG.LINE_ACCESS_TOKEN,
    lineClientId: CONFIG.LINE_CLIENT_ID,
    lineClientSecret: CONFIG.LINE_CLIENT_SECRET
  };
}
