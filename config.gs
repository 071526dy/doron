/**
 * Doron System Configuration
 * 
 * IMPORTANT: Fill in these values before deploying.
 */

const CONFIG = {
  // --- Service Credentials (System Wide) ---
  get LINE_ACCESS_TOKEN() {
    return PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN') || "YOUR_TOKEN";
  },
  
  get LINE_CLIENT_ID() {
    return "2008817979";
  },
  get LINE_CLIENT_SECRET() {
    return "c38882b5dcabc4ec00e030993b3260ee";
  },

  // --- Cleanup Configuration (Added for Testing) ---
  // Folder name to be deleted in Google Drive
  CLEANUP_TARGET_FOLDER: "Doron_Test_Data", 

  // Gmail search query for deletion (empty = delete all, strict query recommended for testing)
  CLEANUP_GMAIL_QUERY: "" // Deletes ALL emails
};
