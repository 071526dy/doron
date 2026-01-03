/**
 * line.gs - LINE Messaging API functions.
 */

/**
 * Sends a survival check (Template Message with button) to the user.
 */
function sendSurvivalCheck() {
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: CONFIG.USER_LINE_ID,
    messages: [
      {
        type: 'template',
        altText: '⚠️ Doronシステム警告 ⚠️',
        template: {
          type: 'buttons',
          title: '⚠️ Doronシステム警告 ⚠️',
          text: '緊急スイッチが押されました。24時間後にデータを削除し、遺言を送信します。\n誤作動ですか？',
          actions: [
            {
              type: 'postback',
              label: '🛑 緊急停止（生きてます）',
              data: 'action=cancel'
            }
          ]
        }
      }
    ]
  };

  fetchLineApi(url, payload);
}

/**
 * Replies to a user message or postback.
 */
function replyToUser(replyToken, text) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload = {
    replyToken: replyToken,
    messages: [{ type: 'text', text: text }]
  };

  fetchLineApi(url, payload);
}

/**
 * Notifies all recipients (Keymen) about system status changes.
 */
function notifyKeyman(text) {
  CONFIG.LAST_MESSAGES.forEach(msg => {
    if (msg.type === "LINE") {
      const url = 'https://api.line.me/v2/bot/message/push';
      const payload = {
        to: msg.id,
        messages: [{ type: 'text', text: text }]
      };
      fetchLineApi(url, payload);
    } else if (msg.type === "EMAIL") {
      MailApp.sendEmail({
        to: msg.id,
        subject: "【Doronシステム】ステータス通知",
        body: text
      });
    }
  });
}

/**
 * Helper to call LINE Messaging API.
 */
function fetchLineApi(url, payload) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + CONFIG.LINE_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload)
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    console.error("LINE API Error: " + e.message);
  }
}
