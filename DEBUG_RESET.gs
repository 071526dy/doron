/**
 * 【緊急用】パスワードとアカウントロックを初期化します。
 * GASエディタからこの関数を実行してください。
 */
function debugResetPassword() {
  const props = PropertiesService.getScriptProperties();
  
  // 保存されているパスワードとロックされたアカウントを削除
  props.deleteProperty('ADMIN_PASSWORD');
  props.deleteProperty('LOCKED_ACCOUNT');
  
  // セッション情報も一応クリア
  PropertiesService.getUserProperties().deleteAllProperties();
  
  console.log('✅ パスワードとアカウントロックを初期化しました。');
  console.log('システムURLに再度アクセスして、新しいパスワードを設定してください。');
}

/**
 * 現在設定されているパスワードをログに表示します。
 */
function debugShowPassword() {
  const props = PropertiesService.getScriptProperties();
  const password = props.getProperty('ADMIN_PASSWORD');
  const lockedAccount = props.getProperty('LOCKED_ACCOUNT');
  
  if (password) {
    console.log('🔑 現在のパスワード: ' + password);
    console.log('📧 登録アカウント: ' + lockedAccount);
  } else {
    console.log('❌ パスワードは設定されていません（初回セットアップ未完了）。');
  }
}

/**
 * 強制的にログイン済みのセッションを発行し、URLを表示します。
 * パスワードなしで管理画面に入ることができます。
 */
function debugAutoLogin() {
  const token = generateSessionToken(); // auth.gs内の関数を使用
  const url = ScriptApp.getService().getUrl() + '?session=' + token;
  
  console.log('✅ 強制ログイン用URLを発行しました（24時間有効）:');
  console.log('🔗 URL: ' + url);
  console.log('このURLをブラウザに貼り付けてアクセスしてください。');
}
