/**
 * Deletes ONLY the specific target folder in user's Google Drive.
 * Uses user's OAuth2 token for access.
 * @param {string} userAccessToken - User's valid OAuth2 access token
 */
function cleanupDrive(userAccessToken) {
  if (!userAccessToken) {
    throw new Error('User access token required for Drive cleanup');
  }
  
  const targetName = CONFIG.CLEANUP_TARGET_FOLDER;
  console.log(`🚀 USER-SCOPED: Deleting folder [${targetName}] from user's Drive...`);
  
  try {
    // Search for folder using Drive API with user's token
    const searchUrl = 'https://www.googleapis.com/drive/v3/files?' +
      'q=' + encodeURIComponent(`name='${targetName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`) +
      '&fields=files(id,name)';
    
    const searchOptions = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + userAccessToken
      },
      muteHttpExceptions: true
    };
    
    const searchResponse = UrlFetchApp.fetch(searchUrl, searchOptions);
    const searchResult = JSON.parse(searchResponse.getContentText());
    
    if (!searchResult.files || searchResult.files.length === 0) {
      console.log(`ℹ️ Target folder [${targetName}] not found in user's Drive.`);
      return;
    }
    
    // Delete each matching folder
    searchResult.files.forEach(folder => {
      const deleteUrl = 'https://www.googleapis.com/drive/v3/files/' + folder.id;
      const deleteOptions = {
        method: 'delete',
        headers: {
          'Authorization': 'Bearer ' + userAccessToken
        },
        muteHttpExceptions: true
      };
      
      const deleteResponse = UrlFetchApp.fetch(deleteUrl, deleteOptions);
      if (deleteResponse.getResponseCode() === 204) {
        console.log(`🔥 Folder PERMANENTLY deleted: ${folder.name} (ID: ${folder.id})`);
      } else {
        console.error(`❌ Failed to delete folder: ${deleteResponse.getContentText()}`);
      }
    });
    
  } catch (e) {
    console.error('❌ Drive Cleanup Error: ' + e.message);
    throw e;
  }
}

/**
 * Deletes Gmail threads from user's mailbox.
 * Uses user's OAuth2 token for access.
 * @param {string} userAccessToken - User's valid OAuth2 access token
 */
function cleanupGmail(userAccessToken) {
  if (!userAccessToken) {
    throw new Error('User access token required for Gmail cleanup');
  }
  
  const query = CONFIG.CLEANUP_GMAIL_QUERY || 'in:inbox';
  console.log(`🚀 USER-SCOPED: Deleting Gmail threads (Query: ${query})...`);
  
  try {
    let deletedCount = 0;
    let pageToken = null;
    const maxThreads = 500;
    
    do {
      // List threads using Gmail API with user's token
      let listUrl = 'https://www.googleapis.com/gmail/v1/users/me/threads?' +
        'q=' + encodeURIComponent(query) +
        '&maxResults=100';
      
      if (pageToken) {
        listUrl += '&pageToken=' + pageToken;
      }
      
      const listOptions = {
        method: 'get',
        headers: {
          'Authorization': 'Bearer ' + userAccessToken
        },
        muteHttpExceptions: true
      };
      
      const listResponse = UrlFetchApp.fetch(listUrl, listOptions);
      const listResult = JSON.parse(listResponse.getContentText());
      
      if (!listResult.threads || listResult.threads.length === 0) {
        break;
      }
      
      // Delete each thread
      listResult.threads.forEach(thread => {
        const deleteUrl = 'https://www.googleapis.com/gmail/v1/users/me/threads/' + thread.id;
        const deleteOptions = {
          method: 'delete',
          headers: {
            'Authorization': 'Bearer ' + userAccessToken
          },
          muteHttpExceptions: true
        };
        
        const deleteResponse = UrlFetchApp.fetch(deleteUrl, deleteOptions);
        if (deleteResponse.getResponseCode() === 204) {
          deletedCount++;
        }
      });
      
      pageToken = listResult.nextPageToken;
      
    } while (pageToken && deletedCount < maxThreads);
    
    console.log(`✅ Gmail Cleanup: ${deletedCount} threads deleted.`);
    
  } catch (e) {
    console.error('❌ Gmail Cleanup Error: ' + e.message);
    throw e;
  }
}

