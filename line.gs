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
          text: `緊急スイッチが押されました。${CONFIG.GRACE_PERIOD_HOURS}時間後にデータを削除し、遺言を送信します。\n誤作動ですか？`,
          actions: [
            {
              type: 'message',
              label: '🛑 緊急停止（生きてます）',
              text: '緊急停止を実行します'
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
  const token = CONFIG.LINE_ACCESS_TOKEN;
  const tokenSnippet = token ? (token.substring(0, 5) + "...") : "(空)";
  const tokenLength = token ? token.length : 0;
  
  if (!token || token.includes("YOUR_")) {
    throw new Error(`LINEアクセストークンが正しく設定されていません。
診断情報: 冒頭5文字=${tokenSnippet}, 文字数=${tokenLength}
ヒント: 詳細設定から正しいトークンを貼り付けて保存してください。`);
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // We will handle response status manually for better error messages
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    console.error("LINE API Error: " + responseText);
    throw new Error(`【V30】LINE APIエラー (${responseCode}): ${responseText}
診断情報: トークン冒頭=${tokenSnippet}, 文字数=${tokenLength}`);
  }
  
  return responseText;
}

/**
 * Test function: Send direct push message
 */
function testDirectPush() {
  console.log("=== Testing Direct Push Message ===");
  
  const userId = CONFIG.USER_LINE_ID;
  const token = CONFIG.LINE_ACCESS_TOKEN;
  
  console.log("User ID: " + userId);
  console.log("Token: " + (token ? token.substring(0, 20) + "..." : "NOT SET"));
  
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: userId,
    messages: [{ type: 'text', text: "🧪 直接プッシュテスト\nこれが届けば、トークンとUser IDは正しいです。" }]
  };
  
  try {
    fetchLineApi(url, payload);
    console.log("✅ Push message sent successfully");
  } catch (e) {
    console.error("❌ Push message failed: " + e.message);
  }
}
