/**
 * TEST_CLEANUP.gs - Safe verification for data deletion.
 */

/**
 * Safely tests Drive cleanup by only targeting the "DoronSafeTest" folder.
 */
function safeTestDriveCleanup() {
  const FOLDER_NAME = 'DoronSafeTest';
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  
  if (!folders.hasNext()) {
    return {
      success: false,
      message: `フォルダ「${FOLDER_NAME}」が見つかりませんでした。Googleドライブのルートに作成してください。`
    };
  }

  const folder = folders.next();
  const files = folder.getFiles();
  let count = 0;

  while (files.hasNext()) {
    const file = files.next();
    file.setTrashed(true);
    count++;
  }

  // Also handle subfolders if any
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    subfolder.setTrashed(true);
    count++;
  }

  if (count === 0) {
    return {
      success: true,
      message: `フォルダ「${FOLDER_NAME}」は既に空でした。テスト用にファイルをいくつか入れて再度お試しください。`
    };
  }

  return {
    success: true,
    message: `成功：フォルダ「${FOLDER_NAME}」内の ${count} 個のアイテムをゴミ箱に移動しました。`
  };
}
