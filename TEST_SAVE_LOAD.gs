/**
 * Test function to verify save and load cycle
 */
function testSaveLoadCycle() {
  console.log("=== TEST: Save/Load Cycle ===");
  
  // 1. Save test data
  const testData = {
    passkey: "test123",
    gracePeriodHours: "24",
    deviceType: "android",
    macrodroidWebhookUrl: "https://example.com",
    lastMessages: [
      {
        name: "テストユーザー",
        type: "LINE",
        id: "TEST_ID_12345",
        message: "これはテストメッセージです"
      }
    ]
  };
  
  console.log("Saving test data:", JSON.stringify(testData));
  const saveResult = saveSettings(testData);
  console.log("Save result:", JSON.stringify(saveResult));
  
  // 2. Load data back
  console.log("\nLoading data back...");
  const loadedData = getSettings();
  console.log("Loaded data:", JSON.stringify(loadedData));
  
  // 3. Check LAST_MESSAGES specifically
  console.log("\nChecking LAST_MESSAGES:");
  console.log("Type:", typeof loadedData.lastMessages);
  console.log("Is array:", Array.isArray(loadedData.lastMessages));
  console.log("Length:", loadedData.lastMessages ? loadedData.lastMessages.length : 0);
  console.log("Content:", JSON.stringify(loadedData.lastMessages));
  
  // 4. Check raw Script Properties
  console.log("\nRaw Script Properties:");
  const props = PropertiesService.getScriptProperties();
  const rawLastMessages = props.getProperty('LAST_MESSAGES');
  console.log("Raw LAST_MESSAGES:", rawLastMessages);
  
  return {
    saved: testData,
    loaded: loadedData,
    match: JSON.stringify(testData.lastMessages) === JSON.stringify(loadedData.lastMessages)
  };
}
