/**
 * DEBUG_DIAGNOSIS.gs
 * Run 'debugEmergencyStop' manually to verify permissions and logic.
 */

function debugEmergencyStop() {
  console.log("--- START DIAGNOSIS ---");
  
  // 1. Check Properties Access
  try {
    const props = PropertiesService.getScriptProperties();
    console.log("✅ Properties Access: OK");
    console.log("USER_LINE_ID: " + props.getProperty('USER_LINE_ID'));
  } catch (e) {
    console.error("❌ Properties Access Failed: " + e.message);
  }

  // 2. Check Trigger Access (Critical for proper function)
  try {
    const triggers = ScriptApp.getProjectTriggers();
    console.log(`✅ Trigger Access: OK. Found ${triggers.length} triggers.`);
    triggers.forEach(t => {
      console.log(` - [${t.getHandlerFunction()}] Source:${t.getEventType()}`);
    });
  } catch (e) {
    console.error("❌ Trigger Access Failed: " + e.message);
    console.error("This suggests the script 'executeAs' mode or permissions are invalid.");
  }

  // 3. Test cancelExecution logic directly
  try {
    console.log("Testing cancelExecution() logic...");
    // We assume cancelExecution is defined in main.gs
    if (typeof cancelExecution === 'function') {
      const result = cancelExecution();
      console.log(`✅ cancelExecution Result: ${result}`);
    } else {
      console.error("❌ cancelExecution function not found!");
    }
  } catch (e) {
    console.error("❌ cancelExecution Crashed: " + e.message);
  }

  // 4. Test LINE Messaging (Verify outbound)
  try {
    console.log("Testing outbound LINE message...");
    const userId = CONFIG.USER_LINE_ID;
    if (userId && userId !== "NOT_SET") {
      const url = 'https://api.line.me/v2/bot/message/push';
      const payload = {
        to: userId,
        messages: [{ type: 'text', text: "🐞 Doron診断\nスクリプトからの直接実行テストです。\nこれが届けば、権限設定は正しいです。" }]
      };
      // Simple fetch without helper to isolate issues
      const token = CONFIG.LINE_ACCESS_TOKEN;
      UrlFetchApp.fetch(url, {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        payload: JSON.stringify(payload)
      });
      console.log("✅ LINE Message Sent");
    } else {
      console.warn("⚠️ Cannot test LINE: User ID not set.");
    }
  } catch (e) {
    console.error("❌ LINE Message Failed: " + e.message);
  }

  console.log("--- END DIAGNOSIS ---");
}
