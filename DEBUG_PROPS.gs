/**
 * DEBUG_PROPS.gs - Debug utility to inspect Script Properties
 */

function debugAllProperties() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  
  console.log("=== ALL SCRIPT PROPERTIES ===");
  for (const key in allProps) {
    console.log(`${key}: ${allProps[key]}`);
  }
  console.log("=== END ===");
}

/**
 * Diagnose Emergency Stop Issue
 */
function debugEmergencyStop() {
  console.log("--- START DIAGNOSIS ---");
  
  // 1. Check Trigger Access
  try {
    const triggers = ScriptApp.getProjectTriggers();
    console.log(`✅ Trigger Access: OK. Found ${triggers.length} triggers.`);
    triggers.forEach(t => {
      console.log(` - [${t.getHandlerFunction()}] Source:${t.getEventType()}`);
    });
  } catch (e) {
    console.error("❌ Trigger Access Failed: " + e.message);
  }

  // 2. Test cancelExecution
  try {
    console.log("Testing cancelExecution() logic...");
    const result = cancelExecution();
    console.log(`✅ cancelExecution Result: ${result}`);
  } catch (e) {
    console.error("❌ cancelExecution Crashed: " + e.message);
  }

  // 3. Test LINE Message
  try {
    console.log("Testing LINE message...");
    const userId = CONFIG.USER_LINE_ID;
    if (userId && userId !== "NOT_SET") {
      const url = 'https://api.line.me/v2/bot/message/push';
      const payload = {
        to: userId,
        messages: [{ type: 'text', text: "🐞 診断テスト\nこれが届けば権限OKです。" }]
      };
      const token = CONFIG.LINE_ACCESS_TOKEN;
      UrlFetchApp.fetch(url, {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        payload: JSON.stringify(payload)
      });
      console.log("✅ LINE Message Sent");
    } else {
      console.warn("⚠️ LINE ID not set.");
    }
  } catch (e) {
    console.error("❌ LINE Message Failed: " + e.message);
  }

  console.log("--- END DIAGNOSIS ---");
}

function debugDumpProperties() {
  const props = PropertiesService.getScriptProperties().getProperties();
  console.log("--- SCRIPT PROPERTIES DUMP ---");
  for (let key in props) {
    console.log(key + ": " + props[key]);
  }
  return { success: true, properties: props };
}

/**
 * Set LINE Access Token
 */
function setLineAccessToken() {
  const token = "lTw3ra+wl/oaqjEcsws2TaDEDhxdFdzi5FAZRgDySyK8W0TIRlmocxgYNElL+zNFin7nh+Po1TzAPLdEdfOIRx34zWPyWlYNRNa6dAIMGdHhbzyuJKFQcfgVd2v4+dg49vyheF/sHM+7OsWGYhmG1AdB04t89/1O/w1cDnyilFU=";
  
  PropertiesService.getScriptProperties().setProperty('LINE_ACCESS_TOKEN', token);
  console.log("✅ LINE_ACCESS_TOKEN has been set successfully!");
  console.log("Token (first 20 chars): " + token.substring(0, 20) + "...");
}

/**
 * Verify LINE Token
 */
function verifyLineToken() {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN');
  
  if (!token || token.trim() === "") {
    console.error("❌ LINE_ACCESS_TOKEN is still empty!");
  } else {
    console.log("✅ LINE_ACCESS_TOKEN is set.");
    console.log("Token (first 20 chars): " + token.substring(0, 20) + "...");
  }
}

/**
 * Test Full Emergency Stop Flow
 */
function testFullEmergencyStop() {
  console.log("=== TESTING FULL EMERGENCY STOP ===");
  
  // 1. Check LINE Token
  const token = CONFIG.LINE_ACCESS_TOKEN;
  console.log("LINE Token: " + (token ? token.substring(0, 20) + "..." : "NOT SET"));
  
  // 2. Check User ID
  const userId = CONFIG.USER_LINE_ID;
  console.log("User ID: " + userId);
  
  // 3. Test cancelExecution
  try {
    const result = cancelExecution();
    console.log("✅ cancelExecution result: " + result);
  } catch (e) {
    console.error("❌ cancelExecution failed: " + e.message);
  }
  
  // 4. Send test message
  try {
    if (userId && userId !== "NOT_SET" && token && token.trim() !== "") {
      replyToUser("DUMMY_TOKEN", "🧪 Full test completed!\nThis is a direct push message.");
      console.log("✅ Message sent (note: replyToUser with dummy token will fail, use push instead)");
      
      // Use push instead
      const url = 'https://api.line.me/v2/bot/message/push';
      const payload = {
        to: userId,
        messages: [{ type: 'text', text: "🧪 完全テスト完了\nこのメッセージが届けば、全て正常です。" }]
      };
      UrlFetchApp.fetch(url, {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        payload: JSON.stringify(payload)
      });
      console.log("✅ Push message sent successfully");
    } else {
      console.error("❌ Cannot send: Token or User ID not set");
    }
  } catch (e) {
    console.error("❌ Message send failed: " + e.message);
  }
  
  console.log("=== TEST COMPLETE ===");
}

/**
 * Find or Create Database and log URL
 */
function debugFindDatabase() {
  console.log("=== SEARCHING FOR DATABASE ===");
  try {
    const ss = DB.getSpreadsheet();
    console.log("✅ Database found or created!");
    console.log("Database Name: " + ss.getName());
    console.log("Database URL: " + ss.getUrl());
    console.log("Database ID: " + ss.getId());
    
    // Check sheets
    const sheets = ss.getSheets().map(s => s.getName());
    console.log("Sheets: " + sheets.join(", "));
    
    // Verify Script Property
    const ssIdInProps = PropertiesService.getScriptProperties().getProperty('DB_SPREADSHEET_ID');
    console.log("Script Property 'DB_SPREADSHEET_ID': " + (ssIdInProps || "MISSING"));
    
    return {
      success: true,
      url: ss.getUrl(),
      id: ss.getId()
    };
  } catch (e) {
    console.error("❌ Failed to find/create database: " + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Set LINE Access Token
 */
function setLineAccessToken() {
  const token = "lTw3ra+wl/oaqjEcsws2TaDEDhxdFdzi5FAZRgDySyK8W0TIRlmocxgYNElL+zNFin7nh+Po1TzAPLdEdfOIRx34zWPyWlYNRNa6dAIMGdHhbzyuJKFQcfgVd2v4+dg49vyheF/sHM+7OsWGYhmG1AdB04t89/1O/w1cDnyilFU=";
  
  PropertiesService.getScriptProperties().setProperty('LINE_ACCESS_TOKEN', token);
  console.log("✅ LINE_ACCESS_TOKEN has been set successfully!");
  console.log("Token (first 20 chars): " + token.substring(0, 20) + "...");
}

/**
 * Verify LINE Token
 */
function verifyLineToken() {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN');
  
  if (!token || token.trim() === "") {
    console.error("❌ LINE_ACCESS_TOKEN is still empty!");
  } else {
    console.log("✅ LINE_ACCESS_TOKEN is set.");
    console.log("Token (first 20 chars): " + token.substring(0, 20) + "...");
  }
}
function debugReadCanonical() { console.log(PropertiesService.getScriptProperties().getProperty('CANONICAL_URL')); }
