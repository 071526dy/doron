/**
 * Deletes ONLY the specific target folder in Google Drive.
 * PRODUCTION MODE: Bypasses trash for permanent deletion.
 */
function cleanupDrive() {
  const targetName = CONFIG.CLEANUP_TARGET_FOLDER;
  console.log(`🚀 PRODUCTION MODE: Permanently deleting folder [${targetName}]...`);
  
  const folders = DriveApp.getFoldersByName(targetName);
  
  if (folders.hasNext()) {
    const folder = folders.next();
    const folderId = folder.getId();
    console.log(`✅ Target folder found: ${folder.getName()} (ID: ${folderId})`);
    
    try {
      // Use Advanced Drive Service to bypass trash
      Drive.Files.remove(folderId);
      console.log("🔥 Folder PERMANENTLY deleted (bypassed trash).");
    } catch (e) {
      console.error("❌ Drive Permanent Deletion Error: " + e.message);
      // Fallback to trash if advanced service fails
      folder.setTrashed(true);
      console.log("🗑️ Fallback: Folder moved to trash.");
    }
  } else {
    console.log(`ℹ️ Target folder [${targetName}] not found. No action taken.`);
  }
}

/**
 * Deletes ALL Gmail threads.
 * REVERTED TO TRASH MODE to fix authorization loop.
 */
function cleanupGmail() {
  console.log("🚀 CLEANUP: Moving ALL Gmail threads to trash...");
  
  try {
    let threads;
    let count = 0;
    const query = CONFIG.CLEANUP_GMAIL_QUERY || ""; // Default to all if empty (be careful)
    
    console.log(`🔍 Gmail Cleanup Query: [${query}]`);

    do {
      // Fetch threads in batches using the query
      if (query) {
        threads = GmailApp.search(query, 0, 100);
      } else {
        // Fallback to inbox if no query (Dangerous production mode)
        threads = GmailApp.getInboxThreads(0, 100);
      }
      
      if (threads.length > 0) {
        GmailApp.moveThreadsToTrash(threads);
        count += threads.length;
      }
    } while (threads.length > 0 && count < 500);
    
    console.log(`✅ Gmail Cleanup: ${count} threads moved to trash (Query: ${query}).`);
  } catch (e) {
    console.error("❌ Gmail Cleanup Error: " + e.message);
  }
}
