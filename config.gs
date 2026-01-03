/**
 * Doron System Configuration
 * 
 * IMPORTANT: Fill in these values before deploying.
 */

const CONFIG = {
  // --- Security ---
  get PASSKEY() {
    return PropertiesService.getScriptProperties().getProperty('PASSKEY') || "YOUR_EMERGENCY_PASSKEY";
  },

  // --- LINE Messaging API ---
  get LINE_ACCESS_TOKEN() {
    return PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN') || "YOUR_LINE_CHANNEL_ACCESS_TOKEN";
  },
  
  // --- LINE Login ---
  get LINE_CLIENT_ID() {
    return PropertiesService.getScriptProperties().getProperty('LINE_CLIENT_ID') || "YOUR_LINE_LOGIN_CHANNEL_ID";
  },
  get LINE_CLIENT_SECRET() {
    return PropertiesService.getScriptProperties().getProperty('LINE_CLIENT_SECRET') || "YOUR_LINE_LOGIN_CHANNEL_SECRET";
  },

  // USER_LINE_ID set via LINE Login
  get USER_LINE_ID() {
    return PropertiesService.getScriptProperties().getProperty('USER_LINE_ID') || "NOT_SET";
  },

  // --- External Services ---
  get MACRODROID_WEBHOOK_URL() {
    return PropertiesService.getScriptProperties().getProperty('MACRODROID_WEBHOOK_URL') || "https://trigger.macrodroid.com/YOUR_ID/doron_trigger";
  },

  // --- System Settings ---
  get GRACE_PERIOD_MS() {
    const hours = parseInt(PropertiesService.getScriptProperties().getProperty('GRACE_PERIOD_HOURS')) || 24;
    return hours * 60 * 60 * 1000;
  },
  
  // --- Destination for Last Messages ---
  get LAST_MESSAGES() {
    const data = PropertiesService.getScriptProperties().getProperty('LAST_MESSAGES');
    return data ? JSON.parse(data) : [
      { name: "Partner", type: "LINE", id: "PARTNER_LINE_ID", message: "今までありがとう。幸せになってください。" },
      { name: "Family", type: "EMAIL", id: "family@example.com", message: "お世話になりました。大切な書類は書斎の引き出しにあります。" }
    ];
  },

  // --- Google Account Info ---
  get USER_EMAIL() {
    return Session.getActiveUser().getEmail();
  }
};
