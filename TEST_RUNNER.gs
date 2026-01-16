/**
 * TEST_RUNNER.gs - Safely verify system settings.
 */

/**
 * Sends a simple test message to the user's registered LINE ID.
 */
function verifyLineConnection() {
  const userId = CONFIG.USER_LINE_ID;
  if (userId === "NOT_SET") {
    throw new Error("LINE連携が完了していません。先にログインボタンから連携してください。");
  }

  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: userId,
    messages: [{ type: 'text', text: "✅ Doronシステム: LINE連携テスト成功です！本番メッセージはこのように届きます。" }]
  };

  fetchLineApi(url, payload);
  return { success: true, message: "テストメッセージを送信しました。LINEを確認してください。" };
}

/**
 * Simulates an emergency trigger (sends survival check to user).
 */
function simulateEmergencyTrigger() {
  sendSurvivalCheck();
  return { success: true, message: "生存確認シミュレーションを開始しました。LINEを確認してください。" };
}

/**
 * Sends all "Last Messages" to the ADMIN (user) for content preview.
 * This prevents spamming actual recipients during testing.
 */
function simulateLastMessages() {
  const userEmail = CONFIG.USER_EMAIL;
  let report = "【遺言送信プレビュー】\n\n実際に送信される内容は以下の通りです：\n\n";

  CONFIG.LAST_MESSAGES.forEach((msg, index) => {
    report += `--- Message ${index + 1} ---\n`;
    report += `宛名: ${msg.name}\n`;
    report += `手段: ${msg.type}\n`;
    report += `送信先: ${msg.id}\n`;
    report += `本文:\n${msg.message}\n\n`;
  });

  // Send the preview to the user's email
  MailApp.sendEmail({
    to: userEmail,
    subject: "【Doronシステム】遺言プレビュー",
    body: report
  });

  return { success: true, message: "登録済みの遺言プレビューをご自身のメール（" + userEmail + "）に送信しました。" };
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
