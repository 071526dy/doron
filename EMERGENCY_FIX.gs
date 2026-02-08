/**
 * Task: Link the manually created form provided by the user.
 * Run this from the GAS editor to force the connection.
 */
function manualLinkTask() {
  const url = "https://docs.google.com/forms/d/1zaghJ6HKLxqpn6OGJNpFgri5W5o9D2_tNnr1-ggiPUI/edit";
  const result = linkExistingForm(url);
  console.log("Link Result:", result);
  return result;
}

/**
 * Run this to FORCE the Google Authorization popup.
 * It will crash if you don't approve it.
 */
function FORCE_AUTHORIZE() {
  // 1. Force Properties Permission
  PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  
  // 2. Force Drive/Gmail Permissions
  DriveApp.getRootFolder().getName();
  GmailApp.getInboxUnreadCount();
  
  // 3. Force Trigger Manager Permission
  ScriptApp.getProjectTriggers();
  
  // 4. Force URL Fetch Permission
  UrlFetchApp.fetch("https://www.google.com");
  
  console.log("--- ALL AUTHORIZATIONS SUCCESSFUL! ---");
}

/**
 * Manually trigger the system as if a form was submitted.
 * @param {string} testKey The key to test.
 */
function manualTriggerTest(testKey = "ys2m1126") {
  console.log("--- MANUAL TRIGGER TEST ---");
  const mockEvent = {
    values: ["MOCK_TIMESTAMP", testKey]
  };
  onFormSubmit(mockEvent);
}

/**
 * Emergency fix: Convert LAST_MESSAGES from object to array if needed
 */
function emergencyFixLastMessages() {
  const props = PropertiesService.getScriptProperties();
  const rawData = props.getProperty('LAST_MESSAGES');
  
  console.log("=== EMERGENCY FIX ===");
  console.log("Raw data:", rawData);
  
  if (!rawData) {
    console.log("No data found, setting empty array");
    props.setProperty('LAST_MESSAGES', '[]');
    return { success: true, message: "空配列に設定しました" };
  }
  
  try {
    const parsed = JSON.parse(rawData);
    console.log("Parsed data:", parsed);
    console.log("Is array:", Array.isArray(parsed));
    
    // If it's an object (not an array), wrap it in an array
    if (!Array.isArray(parsed)) {
      console.log("Converting object to array...");
      const arrayData = [parsed];
      props.setProperty('LAST_MESSAGES', JSON.stringify(arrayData));
      console.log("Converted to array:", arrayData);
      return { success: true, message: "オブジェクトを配列に変換しました: " + JSON.stringify(arrayData) };
    }
    
    return { success: true, message: "既に配列形式です: " + JSON.stringify(parsed) };
  } catch (e) {
    console.error("Parse error:", e);
    return { success: false, message: "エラー: " + e.message };
  }
}
