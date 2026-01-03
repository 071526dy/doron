/**
 * cleanup.gs - Logic to delete files and emails.
 */

/**
 * Deletes all files and folders in Google Drive.
 * Moves to trash first. To permanently delete, Advanced Drive API is required.
 */
function cleanupDrive() {
  // Trashing files
  const files = DriveApp.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    file.setTrashed(true);
  }

  // Trashing folders
  const folders = DriveApp.getFolders();
  while (folders.hasNext()) {
    const folder = folders.next();
    // Root folders that are not trashed already
    if (!folder.isTrashed()) {
      folder.setTrashed(true);
    }
  }
}

/**
 * Deletes all Gmail threads.
 */
function cleanupGmail() {
  let threads;
  // Processing in batches because GmailApp.search has limits
  do {
    threads = GmailApp.search('in:anywhere');
    if (threads.length > 0) {
      GmailApp.moveThreadsToTrash(threads);
    }
  } while (threads.length > 0);
}
