/**
 * TEST_RUNNER.gs - Safely verify system settings.
 */

/**
 * Sends a simple test message to the user's registered LINE ID.
 */
/**
 * Sends a simple test message to the user's registered LINE ID.
 */
function verifyLineConnection(token) {
  if (!validateAdminSession(token)) throw new Error("Unauthorized");
  
  const userId = CONFIG.USER_LINE_ID;
  if (userId === "NOT_SET") {
    throw new Error("LINE連携が完了していません。先にログインボタンから連携してください。");
  }

  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: userId,
    messages: [
      {
        type: 'template',
        altText: '【Doron】接続テスト通知',
        template: {
          type: 'buttons',
          title: '✅ Doronシステム接続テスト',
          text: 'LINEとの連携に成功しました。\nこれはテストですが、本番と同じ形式のボタンを表示しています。',
          actions: [
            {
              type: 'message',
              label: '🛑 緊急停止（テスト）',
              text: '緊急停止テスト実行'
            }
          ]
        }
      }
    ]
  };

  try {
    fetchLineApi(url, payload);
    return { success: true, message: "テストメッセージを送信しました。LINEを確認してください。" };
  } catch (e) {
    return { success: false, message: "エラーが発生しました: " + e.message };
  }
}

/**
 * Simulates an emergency trigger (sends survival check to user).
 */
function simulateEmergencyTrigger(token) {
  if (!validateAdminSession(token)) throw new Error("Unauthorized");

  sendSurvivalCheck();
  // Also start the timer so we can test the "Stop" button cancelling it
  setExecutionTimer();
  return { success: true, message: "生存確認シミュレーションを開始しました。\nLINE送信 ＆ 24時間タイマーを設定しました。" };
}

/**
 * Sends all "Last Messages" to the ADMIN (user) for content preview.
 * This prevents spamming actual recipients during testing.
 */
function simulateLastMessages(token) {
  if (!validateAdminSession(token)) throw new Error("Unauthorized");

  const userEmail = CONFIG.USER_EMAIL;
  // LINE Preview
  let lineResult = "";
  const userId = CONFIG.USER_LINE_ID;
  if (userId && userId !== "NOT_SET") {
    try {
      const url = 'https://api.line.me/v2/bot/message/push';
      const payload = {
        to: userId,
        messages: [{ type: 'text', text: "【遺言送信プレビュー】\n(Admin Preview)\n遺言送信のテストです。" }]
      };
      fetchLineApi(url, payload);
      lineResult = "LINEに送信しました";
    } catch (e) {
      lineResult = "LINE送信失敗: " + e.message;
    }
  }

  return { success: true, message: `プレビューを${lineResult}。` };
}

/**
 * Verifies Drive access permissions.
 */
function verifyDriveAccess() {
  try {
    const folders = DriveApp.getFolders();
    const count = folders.hasNext() ? "アクセス可能" : "フォルダが見つかりません";
    return { success: true, message: "Google Driveへの接続確認: " + count };
  } catch (e) {
    return { success: false, message: "Driveエラー: " + e.message };
  }
}
