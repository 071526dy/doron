/**
 * DEBUG: Check active triggers
 */
function checkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  const report = triggers.map(t => ({
    handler: t.getHandlerFunction(),
    source: t.getTriggerSource().toString(),
    id: t.getUniqueId()
  }));
  console.log("Active Triggers:", JSON.stringify(report, null, 2));
  
  const props = PropertiesService.getScriptProperties().getProperties();
  console.log("Trigger Form ID in Props:", props['TRIGGER_FORM_ID']);
  console.log("Trigger Form URL in Props:", props['TRIGGER_FORM_URL']);
  
  return { triggers: report, props: props };
}

/**
 * Debug function to check what's actually stored in Script Properties
 */
function debugCheckLastMessages() {
  const props = PropertiesService.getScriptProperties();
  const rawData = props.getProperty('LAST_MESSAGES');
  
  console.log("=== DEBUG: LAST_MESSAGES ===");
  console.log("Raw data type:", typeof rawData);
  console.log("Raw data value:", rawData);
  console.log("Raw data length:", rawData ? rawData.length : 0);
  
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData);
      console.log("Parsed successfully");
      console.log("Parsed type:", typeof parsed);
      console.log("Is array:", Array.isArray(parsed));
      console.log("Parsed value:", JSON.stringify(parsed));
      console.log("Array length:", parsed.length);
    } catch (e) {
      console.error("Parse failed:", e.message);
    }
  }
  
  // Also check what CONFIG.LAST_MESSAGES returns
  console.log("\n=== CONFIG.LAST_MESSAGES ===");
  const configMessages = CONFIG.LAST_MESSAGES;
  console.log("Type:", typeof configMessages);
  console.log("Is array:", Array.isArray(configMessages));
  console.log("Value:", JSON.stringify(configMessages));
  
  return {
    rawData: rawData,
    configMessages: configMessages
  };
}

/**
 * Force reset LAST_MESSAGES to empty array
 */
function forceResetLastMessages() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('LAST_MESSAGES', '[]');
  console.log("LAST_MESSAGES has been reset to empty array");
  return { success: true, message: "リセット完了。ページをリフレッシュしてください。" };
}
