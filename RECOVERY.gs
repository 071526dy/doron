function restoreLostSettings() {
  const props = PropertiesService.getScriptProperties();
  const recoveredID = "C651b5036b975f2efab1fac37bbed2816";
  
  // Logic check removed. Force clean state restoration.
  const fixedMessages = [
    {
      name: "テスト",
      type: "LINE",
      id: recoveredID,
      message: "テストだよん"
    }
  ];
  
  props.setProperty('LAST_MESSAGES', JSON.stringify(fixedMessages));
  
  // Verify persistence immediately
  const savedData = props.getProperty('LAST_MESSAGES');
  console.log("Forced recovery of ID: " + recoveredID);
  console.log("Verification read: " + savedData);
  
  return { success: true, message: "データを強制的に復元しました。\n\n確認: サーバ上のデータサイズ=" + (savedData ? savedData.length : 0) + "\n\nこのメッセージを閉じたら、必ず画面をリフレッシュしてください。" };
}
