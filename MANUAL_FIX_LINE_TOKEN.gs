/**
 * MANUAL_FIX_LINE_TOKEN.gs
 * Use this to manually set the LINE Access Token if the management UI is not accessible.
 */

function setLineAccessToken() {
  // ⚠️ REPLACE THIS WITH YOUR ACTUAL TOKEN FROM LINE DEVELOPERS CONSOLE
  const token = "lTw3ra+wl/oaqjEcsws2TaDEDhxdFdzi5FAZRgDySyK8W0TIRlmocxgYNElL+zNFin7nh+Po1TzAPLdEdfOIRx34zWPyWlYNRNa6dAIMGdHhbzyuJKFQcfgVd2v4+dg49vyheF/sHM+7OsWGYhmG1AdB04t89/1O/w1cDnyilFU=";
  
  if (token === "YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE") {
    console.error("❌ Please replace the placeholder with your actual LINE Access Token!");
    return;
  }
  
  PropertiesService.getScriptProperties().setProperty('LINE_ACCESS_TOKEN', token);
  console.log("✅ LINE_ACCESS_TOKEN has been set successfully!");
  console.log("Token (first 20 chars): " + token.substring(0, 20) + "...");
}

/**
 * Verify the token is set correctly
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
