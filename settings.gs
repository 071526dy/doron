/**
 * settings.gs - Handles persistence of system configuration.
 * Salt: 6e9b2c3a-8f1d-4e9b-b4a1-f3c5d7b8e9f0
 */

/**
 * Saves all settings passed from the frontend.
 * @param {string} token Session token
 * @param {Object} data Settings data object.
 */
function saveSettings(token, data) {
  const session = DB.getSession(token);
  if (!session) throw new Error("セッション切れです。再ログインしてください。");

  const email = session.user_email;
  const user = DB.getUser(email);
  if (!user) throw new Error("ユーザーが見つかりません。");

  console.log(`Saving settings for ${email}: ` + JSON.stringify(data));
  
  // Update User Table
  if (data.passkey !== undefined) {
    const newPasskey = data.passkey.trim();
    if (newPasskey && newPasskey !== user.passkey) {
      // Check if another user already has this passkey
      const collision = DB.getUserByPasskey(newPasskey);
      if (collision && collision.email !== email) {
        throw new Error("この緊急パスキーは既に別のユーザーが使用しています。別の言葉を設定してください。");
      }
      user.passkey = newPasskey;
    } else if (!newPasskey) {
      user.passkey = "";
    }
  }
  if (data.gracePeriodHours) user.grace_period_hours = data.gracePeriodHours;
  if (data.deviceType) user.device_type = data.deviceType;
  if (data.macrodroidWebhookUrl !== undefined) user.macrodroid_url = data.macrodroidWebhookUrl.trim();
  
  DB.saveUser(user);

  // Update Messages Table
  if (data.lastMessages !== undefined) {
    const validMessages = data.lastMessages.filter(msg => msg.name || msg.id || msg.message);
    DB.setMessages(email, validMessages);
  }
  
  return { success: true, message: "設定を保存しました。内容はユーザーごとに安全に保持されます。" };
}

/**
 * Retrieves current settings for the frontend.
 */
function getSettings(token) {
  const session = DB.getSession(token);
  if (!session) throw new Error("セッション切れです。再ログインしてください。");

  // Lazy migration check
  DB.ensurePasskeyColumn();

  const email = session.user_email;
  const user = DB.getUser(email);
  if (!user) throw new Error("ユーザーデータの取得に失敗しました。");

  const messages = DB.getMessages(email);
  const maskDefault = (val) => (val && val.includes("YOUR_")) ? "" : val;

  return {
    passkey: user.passkey || "",
    gracePeriodHours: parseInt(user.grace_period_hours) || 24,
    macrodroidWebhookUrl: user.macrodroid_url || "",
    deviceType: user.device_type || "android",
    lastMessages: messages,
    userLineId: user.line_id || "NOT_SET",
    userEmail: email,
    // Service-wide credentials (from ScriptProperties / CONFIG)
    lineAccessToken: maskDefault(CONFIG.LINE_ACCESS_TOKEN),
    lineClientId: maskDefault(CONFIG.LINE_CLIENT_ID),
    lineClientSecret: maskDefault(CONFIG.LINE_CLIENT_SECRET),
    scriptUrl: getAppUrl(),
    hasFormsPermission: true
  };
}

function checkFormsPermission() {
  try {
    // Try a benign call that requires the scope
    FormApp.getActiveForm(); 
    return true;
  } catch (e) {
    console.warn("Forms permission check failed:", e.message);
    return false;
  }
}
