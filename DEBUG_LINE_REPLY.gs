/**
 * DEBUG_LINE_REPLY.gs - Debug script to test LINE reply functionality
 * 
 * How to use:
 * 1. Open GAS Editor
 * 2. Run this function manually
 * 3. Check the execution log for errors
 * 4. Send a test message to your LINE bot
 * 5. Check the doPost execution log
 */

/**
 * Test 1: Check if LINE Access Token is properly configured
 */
function debugCheckToken() {
  console.log("=== DEBUG: Checking LINE Access Token ===");
  
  const token = CONFIG.LINE_ACCESS_TOKEN;
  console.log("Token exists: " + (token ? "YES" : "NO"));
  console.log("Token length: " + (token ? token.length : 0));
  console.log("Token preview: " + (token ? token.substring(0, 10) + "..." : "EMPTY"));
  console.log("Token contains placeholder: " + (token && token.includes("YOUR_") ? "YES (BAD!)" : "NO (GOOD)"));
  
  // Check if it's the hardcoded token from config.gs
  if (token && token.startsWith("lTw3ra")) {
    console.log("✅ Using hardcoded token from config.gs");
  } else {
    console.log("⚠️ Token might be from Script Properties");
  }
  
  return {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    isHardcoded: token && token.startsWith("lTw3ra")
  };
}

/**
 * Test 2: Simulate a webhook event with reply token
 * This simulates what happens when user presses the emergency stop button
 */
function debugSimulateWebhook() {
  console.log("=== DEBUG: Simulating Webhook Event ===");
  
  // Create a mock webhook event (like what LINE sends)
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        events: [
          {
            type: 'message',
            message: {
              type: 'text',
              text: '緊急停止を実行します'
            },
            replyToken: 'MOCK_REPLY_TOKEN_FOR_TESTING',
            source: {
              userId: CONFIG.USER_LINE_ID,
              type: 'user'
            }
          }
        ]
      })
    }
  };
  
  console.log("Mock event created");
  console.log("Event type: message");
  console.log("Message text: 緊急停止を実行します");
  console.log("Reply token: MOCK_REPLY_TOKEN_FOR_TESTING");
  
  try {
    // This will fail because the reply token is fake, but we can see where it fails
    const result = doPost(mockEvent);
    console.log("✅ doPost executed without throwing error");
    console.log("Result: " + result.getContent());
  } catch (e) {
    console.error("❌ doPost threw error: " + e.message);
    console.error("Stack: " + e.stack);
  }
}

/**
 * Test 3: Check the actual doPost logs
 * Run this AFTER pressing the emergency stop button in LINE
 */
function debugCheckRecentLogs() {
  console.log("=== DEBUG: Instructions ===");
  console.log("1. Press the emergency stop button in LINE");
  console.log("2. Wait 5 seconds");
  console.log("3. Go to GAS Editor > Executions");
  console.log("4. Look for the most recent 'doPost' execution");
  console.log("5. Check if there are any errors");
  console.log("");
  console.log("Common issues:");
  console.log("- 'Invalid reply token' = The reply token expired (only valid for a few minutes)");
  console.log("- '401 Unauthorized' = LINE Access Token is wrong");
  console.log("- '400 Bad Request' = Payload format is wrong");
  console.log("- No logs at all = Webhook URL is not configured correctly");
}

/**
 * Test 4: Send a direct push message (doesn't need reply token)
 * This tests if the LINE API connection works at all
 */
function debugSendDirectMessage() {
  console.log("=== DEBUG: Sending Direct Push Message ===");
  
  const userId = CONFIG.USER_LINE_ID;
  console.log("Target User ID: " + userId);
  
  if (userId === "NOT_SET") {
    console.error("❌ USER_LINE_ID is not set!");
    return;
  }
  
  try {
    const url = 'https://api.line.me/v2/bot/message/push';
    const payload = {
      to: userId,
      messages: [{ 
        type: 'text', 
        text: '🧪 デバッグテスト\nこのメッセージが届けば、LINEアクセストークンは正しいです。' 
      }]
    };
    
    fetchLineApi(url, payload);
    console.log("✅ Direct push message sent successfully!");
    console.log("Check your LINE app - you should receive a message");
  } catch (e) {
    console.error("❌ Failed to send direct message: " + e.message);
    console.error("Stack: " + e.stack);
  }
}

/**
 * Run all debug tests
 */
function runAllDebugTests() {
  console.log("========================================");
  console.log("RUNNING ALL DEBUG TESTS");
  console.log("========================================");
  
  debugCheckToken();
  console.log("");
  
  debugSendDirectMessage();
  console.log("");
  
  debugCheckRecentLogs();
  console.log("");
  
  console.log("========================================");
  console.log("DEBUG TESTS COMPLETE");
  console.log("========================================");
}
