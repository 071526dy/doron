/**
 * DEBUG_TRIGGERS.gs - Helper functions to manage and verify GAS triggers.
 */

/**
 * Lists all triggers currently active in this project.
 * Run this manually from the GAS editor.
 */
function listAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  console.log(`--- [DEBUG] Total Triggers: ${triggers.length} ---`);
  
  if (triggers.length === 0) {
    console.log("No triggers found.");
    return;
  }

  triggers.forEach((t, i) => {
    console.log(`[${i+1}] ID: ${t.getUniqueId()}`);
    console.log(`    Handler: ${t.getHandlerFunction()}`);
    console.log(`    Source:  ${t.getTriggerSource()}`);
    console.log(`    Event:   ${t.getEventType()}`);
  });
  console.log("-----------------------------------------");
}

/**
 * Manually sets the execution timer (for testing).
 */
function testSetTimer() {
  console.log("Setting test trigger for 'executeDoron' (60 seconds)...");
  ScriptApp.newTrigger('executeDoron')
    .timeBased()
    .after(60 * 1000)
    .create();
  listAllTriggers();
}

/**
 * Manually runs the cancellation function.
 */
function testCancelTrigger() {
  console.log("Running manual cancellation...");
  const result = cancelExecution();
  console.log("Result: " + result);
  listAllTriggers();
}
