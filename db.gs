/**
 * db.gs - Database Access Layer (Spreadsheet-based)
 */

const DB_NAME = "Doron_Service_Database";

const DB = {
  /**
   * Gets or creates the database spreadsheet.
   */
  getSpreadsheet: function() {
    const props = PropertiesService.getScriptProperties();
    let ssId = props.getProperty('DB_SPREADSHEET_ID');
    
    if (ssId) {
      try {
        return SpreadsheetApp.openById(ssId);
      } catch (e) {
        console.warn("Stored SS ID invalid, searching by name...");
      }
    }
    
    // Search by name
    const files = DriveApp.getFilesByName(DB_NAME);
    if (files.hasNext()) {
      const ss = SpreadsheetApp.open(files.next());
      props.setProperty('DB_SPREADSHEET_ID', ss.getId());
      return ss;
    }
    
    // Create new
    const ss = SpreadsheetApp.create(DB_NAME);
    props.setProperty('DB_SPREADSHEET_ID', ss.getId());
    this.initSchema(ss);
    return ss;
  },

  /**
   * Ensures the 'passkey' column exists (migration)
   */
  ensurePasskeyColumn: function() {
    const ss = this.getSpreadsheet();
    const sheet = ss.getSheetByName("users");
    if (!sheet) return;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers.indexOf("passkey") === -1) {
      const lineIdIdx = headers.indexOf("line_id");
      if (lineIdIdx !== -1) {
        sheet.insertColumnAfter(lineIdIdx + 1);
        sheet.getRange(1, lineIdIdx + 2).setValue("passkey");
        console.log("Migration: Added 'passkey' column.");
      }
    }
  },

  /**
   * Initializes sheet names and headers.
   */
  initSchema: function(ss) {
    const schemas = {
      "users": ["email", "hashed_password", "salt", "line_id", "passkey", "macrodroid_url", "device_type", "grace_period_hours", "created_at"],
      "messages": ["user_email", "recipient_name", "type", "recipient_id", "message_body"],
      "sessions": ["token", "user_email", "expires_at"],
      "triggers": ["user_email", "target_execution_time", "status"]
    };

    for (let sheetName in schemas) {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      sheet.clear();
      sheet.getRange(1, 1, 1, schemas[sheetName].length).setValues([schemas[sheetName]]);
      sheet.setFrozenRows(1);
    }
    
    // Remove default Sheet1 if it exists
    const sheet1 = ss.getSheetByName("シート1") || ss.getSheetByName("Sheet1");
    if (sheet1 && ss.getSheets().length > 1) {
      ss.deleteSheet(sheet1);
    }
  },

  /**
   * Generic find row by column value
   */
  findRow: function(sheetName, colName, value) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colIdx = headers.indexOf(colName);
    
    if (colIdx === -1) throw new Error(`Column ${colName} not found in ${sheetName}`);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][colIdx] === value) {
        // Return object mapping
        const obj = {};
        headers.forEach((h, index) => {
          obj[h] = data[i][index];
        });
        obj._rowIdx = i + 1;
        return obj;
      }
    }
    return null;
  },

  /**
   * Upsert row
   */
  upsertRow: function(sheetName, keyColName, keyValue, dataObj) {
    const ss = this.getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const existing = this.findRow(sheetName, keyColName, keyValue);
    
    const rowValues = headers.map(h => dataObj[h] !== undefined ? dataObj[h] : "");
    
    if (existing) {
      sheet.getRange(existing._rowIdx, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  },

  // User Space
  getUser: function(email) {
    return this.findRow("users", "email", email);
  },
  
  getUserByLineId: function(lineId) {
    return this.findRow("users", "line_id", lineId);
  },

  getUserByPasskey: function(passkey) {
    if (!passkey) return null;
    return this.findRow("users", "passkey", passkey);
  },

  saveUser: function(userData) {
    if (!userData.email) throw new Error("Email required to save user");
    this.upsertRow("users", "email", userData.email, userData);
  },

  // Session Space
  saveSession: function(token, email, expiresAt) {
    this.upsertRow("sessions", "token", token, {
      token: token,
      user_email: email,
      expires_at: expiresAt
    });
  },

  getSession: function(token) {
    return this.findRow("sessions", "token", token);
  },

  deleteSession: function(token) {
    const existing = this.findRow("sessions", "token", token);
    if (existing) {
      this.getSpreadsheet().getSheetByName("sessions").deleteRow(existing._rowIdx);
    }
  },

  // Message Space
  getMessages: function(email) {
    const sheet = this.getSpreadsheet().getSheetByName("messages");
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const userColIdx = headers.indexOf("user_email");
    
    return data.slice(1)
      .filter(row => row[userColIdx] === email)
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      });
  },

  setMessages: function(email, messages) {
    const ss = this.getSpreadsheet();
    const sheet = ss.getSheetByName("messages");
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const userColIdx = headers.indexOf("user_email");
    
    // Remove old
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][userColIdx] === email) {
        sheet.deleteRow(i + 1);
      }
    }
    
    // Append new
    messages.forEach(msg => {
      const row = headers.map(h => {
        if (h === "user_email") return email;
        return msg[h] !== undefined ? msg[h] : "";
      });
      sheet.appendRow(row);
    });
  }
};
