/**
 * notifications.gs - Sending last messages.
 */

function sendLastMessagesToAll() {
  CONFIG.LAST_MESSAGES.forEach(msg => {
    if (msg.type === "LINE") {
      sendLineMessage(msg.id, msg.message);
    } else if (msg.type === "EMAIL") {
      sendEmailMessage(msg.id, msg.message);
    }
  });
}

function sendLineMessage(toId, text) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: toId,
    messages: [{ type: 'text', text: text }]
  };
  fetchLineApi(url, payload);
}

function sendEmailMessage(toEmail, text) {
  MailApp.sendEmail({
    to: toEmail,
    subject: "大切な方へ（ラストメッセージ）",
    body: text
  });
}

/**
 * macrodroid.gs - Triggering device wipe.
 */

function triggerDeviceWipe() {
  if (!CONFIG.MACRODROID_WEBHOOK_URL) return;

  const options = {
    method: 'get' // MacroDroid usually listens for GET triggers
  };

  try {
    UrlFetchApp.fetch(CONFIG.MACRODROID_WEBHOOK_URL, options);
  } catch (e) {
    console.error("MacroDroid Trigger Error: " + e.message);
  }
}
