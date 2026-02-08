/**
 * main.gs - Multi-User Service Controller
 */

function doGet(e) {
  try {
    // 0. Serving Emergency Trigger Page
    if (e && e.parameter && e.parameter.page === 'trigger') {
      return renderHtml('trigger', {
        scriptUrl: getAppUrl("")
      });
    }

    // 0.1 Diagnostic Page
    if (e && e.parameter && e.parameter.page === 'diag') {
      return HtmlService.createHtmlOutput("<h1>Doron Service: OK</h1><p>Running in Multi-User Mode.</p>")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // 1. Handle OAuth callback (LINE Authorize)
    if (e && e.parameter && e.parameter.code) {
      return handleAuthCallback(e.parameter.code, e.parameter.state);
    }

    // 2. Serving SPA (index.html)
    const sessionToken = (e && e.parameter) ? e.parameter.session : null;
    
    let userEmail = "Anonymous";
    try {
      userEmail = Session.getActiveUser().getEmail() || "Anonymous";
    } catch(err) {
      // Ignored
    }

    // Check if first time (no user record or no password set)
    const user = (userEmail !== "Anonymous") ? DB.getUser(userEmail) : null;
    const isFirstTime = !user || !user.hashed_password;

    return renderHtml('index', {
      userEmail: userEmail,
      isFirstTime: isFirstTime,
      sessionToken: sessionToken || "",
      scriptUrl: getAppUrl(""),
      switchAccountUrl: "https://accounts.google.com/AccountChooser?service=wise&continue=" + encodeURIComponent(getAppUrl(""))
    });

  } catch (err) {
    console.error("Critical doGet Error: " + err.message);
    return HtmlService.createHtmlOutput("System Error: " + err.message);
  }
}

function renderHtml(filename, data) {
  const template = HtmlService.createTemplateFromFile(filename);
  for (let key in data) { template[key] = data[key]; }
  return template.evaluate()
    .setTitle('Doron System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * LINE Messaging API Webhook (Multi-tenant routing)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const event = postData.events[0];
    if (!event) return ContentService.createTextOutput('ok');

    const lineUserId = event.source.userId;
    const user = DB.getUserByLineId(lineUserId);

    if (event.type === 'message') {
      const text = event.message.text.trim();
      
      // Admin helper to get ID
      if (text.toLowerCase() === 'id') {
        replyToUser(event.replyToken, `あなたのLINE IDは: ${lineUserId}\n管理画面に設定してください。`);
        return ContentService.createTextOutput('ok');
      }

      if (user && (text === '生存確認' || text === '生存' || text === 'stop' || text === 'キャンセル')) {
        cancelExecution(user.email);
        sendLineMessage(lineUserId, "✅ 生存を確認しました。Doronシーケンスを停止しました。");
      }
    } else if (event.type === 'postback' && user) {
      const data = event.postback.data;
      if (data === 'action=stop') {
        cancelExecution(user.email);
        sendLineMessage(lineUserId, "✅ 緊急停止ボタンが押されました。シーケンスを停止しました。");
      }
    }
  } catch (err) {
    console.error("Webhook route error: " + err.message);
  }
  return ContentService.createTextOutput('ok');
}

/**
 * DB-backed cancellation
 */
function cancelExecution(userEmail) {
  const ss = DB.getSpreadsheet();
  const sheet = ss.getSheetByName("triggers");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userColIdx = headers.indexOf("user_email");
  const statusColIdx = headers.indexOf("status");
  
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][userColIdx] === userEmail && data[i][statusColIdx] === "PENDING") {
      sheet.getRange(i + 1, statusColIdx + 1).setValue("CANCELLED");
    }
  }
}

/**
 * Master Clock: Periodic Scanner
 */
function processMasterClock() {
  const ss = DB.getSpreadsheet();
  const sheet = ss.getSheetByName("triggers");
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  const headers = data[0];
  const userColIdx = headers.indexOf("user_email");
  const timeColIdx = headers.indexOf("target_execution_time");
  const statusColIdx = headers.indexOf("status");
  
  const now = new Date();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][statusColIdx] === "PENDING") {
      const targetTime = new Date(data[i][timeColIdx]);
      if (now >= targetTime) {
        const email = data[i][userColIdx];
        sheet.getRange(i + 1, statusColIdx + 1).setValue("EXECUTING");
        try {
          executeByEmail(email);
          sheet.getRange(i + 1, statusColIdx + 1).setValue("DONE");
        } catch (e) {
          sheet.getRange(i + 1, statusColIdx + 1).setValue("FAILED: " + e.message);
        }
      }
    }
  }
}

/**
 * Execute by user email context
 */
function executeByEmail(userEmail) {
  const user = DB.getUser(userEmail);
  const messages = DB.getMessages(userEmail);
  
  // 1. Send messages
  messages.forEach(msg => {
    if (msg.type === 'LINE') {
      sendLineMessage(msg.recipient_id, msg.message_body);
    } else {
      MailApp.sendEmail(msg.recipient_id, "Doronシステム通知", msg.message_body);
    }
  });

  // 2. Device Wipe
  if (user.macrodroid_url) {
    try { UrlFetchApp.fetch(user.macrodroid_url); } catch(e) { console.error("Wipe failed: " + e.message); }
  }
  
  // 3. Optional Drive/Gmail cleanup
  // (In service mode, this requires user-scoped OAuth tokens stored in DB)
  // For now, we perform the actions authorized by the developer deployment if scopes match.
  try { cleanupDrive(); } catch(e) { console.error("Drive Wipe Failed: " + e.message); }
  try { cleanupGmail(); } catch(e) { console.error("Gmail Wipe Failed: " + e.message); }
}

/**
 * Public: Emergency Trigger via Web Page or Form
 */
function submitTriggerPasskey(inputPasskey) {
  if (!inputPasskey) return { success: false, message: "パスキーを入力してください。" };
  
  const cleanPasskey = inputPasskey.trim();
  // Find the specific user owning this unique passkey
  const user = DB.getUserByPasskey(cleanPasskey);
  
  if (!user) {
    return { success: false, message: "パスキーが正しくないか、登録されていません。" };
  }

  if (!user.line_id) {
    return { success: false, message: "LINE連携が完了していないため、通知を送れません。" };
  }

  const waitHours = parseInt(user.grace_period_hours) || 24;
  const target = new Date(new Date().getTime() + (waitHours * 60 * 60 * 1000));
  
  // Register the trigger in DB
  DB.upsertRow("triggers", "user_email", user.email, {
    user_email: user.email,
    target_execution_time: target,
    status: "PENDING"
  });

  // Notify user via LINE
  sendSurvivalCheck(user.line_id, getAppUrl(""));
  console.log(`Emergency Triggered for ${user.email} via Passkey.`);
  
  return { success: true, message: `システムを確認しました。${user.email} さんのLINEに生存確認メッセージを送信します。` };
}

/**
 * Trigger: Handle Google Form Submission
 */
function onFormSubmit(e) {
  try {
    let passkey = "";
    if (e.response) { // Form Trigger
      const responses = e.response.getItemResponses();
      passkey = responses[0].getResponse();
    } else if (e.values) { // Spreadsheet Trigger
      passkey = e.values[1];
    }
    
    if (passkey) {
      submitTriggerPasskey(passkey);
    }
  } catch (err) {
    console.error("Form submit error: " + err.message);
  }
}

/**
 * Survival Check Trigger (Passkey validation for Admin Panel Test)
 */
function handlePasskeyTrigger(sessionToken, inputPasskey) {
  const session = DB.getSession(sessionToken);
  if (!session) throw new Error("セッション切れです。再ログインしてください。");

  // Lazy migration check
  DB.ensurePasskeyColumn();

  const email = session.user_email;
  const user = DB.getUser(email);
  if (!user) throw new Error("ユーザーデータの取得に失敗しました。");
  // In the admin panel, we check the user's OWN passkey
  if (!user || user.passkey !== inputPasskey.trim()) {
    return { success: false, message: "設定したパスキーと一致しません。" };
  }

  if (!user.line_id) {
    return { success: false, message: "LINE連携が必要です。" };
  }

  const waitHours = parseInt(user.grace_period_hours) || 24;
  const target = new Date(new Date().getTime() + (waitHours * 60 * 60 * 1000));
  
  DB.upsertRow("triggers", "user_email", user.email, {
    user_email: user.email,
    target_execution_time: target,
    status: "PENDING"
  });

  sendSurvivalCheck(user.line_id, getAppUrl(""));
  return { success: true, message: "生存確認メッセージを送信しました。" };
}

/**
 * Admin: Initialize the system periodic trigger
 */
function adminInitMasterClock() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let t of triggers) {
    if (t.getHandlerFunction() === 'processMasterClock') ScriptApp.deleteTrigger(t);
  }
  ScriptApp.newTrigger('processMasterClock').timeBased().everyMinutes(5).create();
  return { success: true, message: "Master Clock Trigger started." };
}
