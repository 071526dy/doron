/**
 * main.gs - Entry points for the Doron system.
 */

/**
 * Handles GET requests to show the setup/login page.
 */
function doGet(e) {
  // Handle OAuth callback
  if (e.parameter.code) {
    return handleAuthCallback(e.parameter.code);
  }

  // Check if redirection from login came back
  const status = e.parameter.status || "";

  // Prepare template
  const template = HtmlService.createTemplateFromFile('index');
  template.config = getSettings();
  template.statusMessage = status === 'success' ? 'LINE連携が完了しました。' : '';

  return template.evaluate()
    .setTitle('Doron System Setup')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Triggered when the Google Form is submitted.
 * @param {Object} e Form submission event object
 */
function onFormSubmit(e) {
  const responses = e.values; // Array of responses
  const inputPasskey = responses[1]; // Assuming Passkey is the first question (index 1)

  if (inputPasskey !== CONFIG.PASSKEY) {
    console.warn("Invalid passkey attempt.");
    return;
  }

  const userId = CONFIG.USER_LINE_ID;
  if (userId === "NOT_SET") {
    console.error("USER_LINE_ID is not set. Please complete the setup via the web app.");
    return;
  }

  // 1. Send Survival Check to the user via LINE
  sendSurvivalCheck();

  // 2. Set the 24-hour timer
  setExecutionTimer();
  
  console.log("Doron triggered. 24h timer started.");
}

/**
 * Handles incoming Webhook requests from LINE.
 * @param {Object} e Request event object
 */
function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];

  if (!event) return;

  // Handle postback (Button click)
  if (event.type === 'postback') {
    const data = event.postback.data;
    if (data === 'action=cancel') {
      cancelExecution();
      replyToUser(event.replyToken, "🛑 緊急停止を受け付けました。処理を中断します。");
      notifyKeyman("本人による生存確認が取れたため、処理を中断しました。");
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ content: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Sets a time-based trigger for 24 hours later.
 */
function setExecutionTimer() {
  ScriptApp.newTrigger('executeDoron')
    .timeBased()
    .after(CONFIG.GRACE_PERIOD_MS)
    .create();
}

/**
 * Cancels all 'executeDoron' triggers.
 */
function cancelExecution() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'executeDoron') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

/**
 * The final execution function.
 */
function executeDoron() {
  console.log("Executing Doron sequence...");
  
  // 1. Cleanup Drive
  cleanupDrive();
  
  // 2. Cleanup Gmail
  cleanupGmail();
  
  // 3. Trigger MacroDroid (Android Wipe)
  triggerDeviceWipe();
  
  // 4. Send Last Messages
  sendLastMessagesToAll();
  
  console.log("Doron sequence complete.");
}
