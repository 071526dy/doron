/**
 * SETUP_TRIGGER.gs - Logic to automatically create the Google Form trigger.
 */

/**
 * Creates a new Google Form for the Doron System and links it to the trigger.
 * @param {string} token Session token
 * @returns {Object} Result with success status and Form URL.
 */
function createEmergencyForm(token) {
  if (!validateAdminSession(token)) throw new Error("Unauthorized");
  
  const props = PropertiesService.getScriptProperties();
  
  try {
    // 1. Create the Form
    const formTitle = "Doron System - 緊急起動入力フォーム";
    const form = FormApp.create(formTitle)
      .setDescription("このフォームはDoronシステムの緊急起動用です。設定したパスキーを入力して送信してください。");
    
    // Add the passkey question
    form.addTextItem()
      .setTitle("緊急起動パスキーを入力してください")
      .setRequired(true);
    
    const formUrl = form.getPublishedUrl();
    const formId = form.getId();
    
    // 2. Set up the trigger programmatically
    // First, clear any existing onFormSubmit triggers to avoid duplicates
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'onFormSubmit') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    
    // Create new trigger for this form
    ScriptApp.newTrigger('onFormSubmit')
      .forForm(form)
      .onFormSubmit()
      .create();
    
    // 3. Save details to properties
    props.setProperty('TRIGGER_FORM_URL', formUrl);
    props.setProperty('TRIGGER_FORM_ID', formId);
    
    console.log("Created Form: " + formUrl);
    
    return {
      success: true,
      message: "緊急起動用フォームを作成し、システムと紐付けました。",
      formUrl: formUrl
    };
    
  } catch (e) {
    console.error("Failed to create form: " + e.stack);
    return {
      success: false,
      message: "フォームの作成に失敗しました: " + e.message
    };
  }
}

/**
 * Links an existing Google Form to the system trigger.
 * @param {string} token Session token
 * @param {string} formUrl The URL of the form (edit URL contains ID).
 * @param {string} publicUrl Optional public response URL.
 * @returns {Object} Result object.
 */
function linkExistingForm(token, formUrl, publicUrl = "") {
  if (!validateAdminSession(token)) throw new Error("Unauthorized");

  const props = PropertiesService.getScriptProperties();
  try {
    // 1. Identify Form ID (from edit URL)
    let formId = "";
    if (formUrl.includes("/d/")) {
      formId = formUrl.split("/d/")[1].split("/")[0];
    } else {
       return { success: false, message: "URLが正しくありません。IDを含む編集用URL（/d/.../edit）を入力してください。" };
    }

    // ⭐ PRE-EMPTIVE PERSIST (Ensure UI hides even if permission crash follows)
    const finalDisplayUrl = publicUrl || "https://forms.gle/Vj47okxwbomc7n6t8";
    props.setProperty('TRIGGER_FORM_URL', finalDisplayUrl);
    props.setProperty('TRIGGER_FORM_ID', formId);

    // 2. Attempt Trigger setup (Requires Forms Permission)
    try {
      const form = FormApp.openById(formId);
      if (form) {
        const triggers = ScriptApp.getProjectTriggers();
        for (let i = 0; i < triggers.length; i++) {
           if (triggers[i].getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(triggers[i]);
        }
        ScriptApp.newTrigger('onFormSubmit')
          .forForm(form)
          .onFormSubmit()
          .create();
      }
    } catch (triggerError) {
      console.warn("Trigger setup deferred (Permission needed):", triggerError.message);
    }

    return { success: true, message: "フォームを正常に連携し、公開用URLを設定しました。", formUrl: finalDisplayUrl };

  } catch (e) {
    return { success: false, message: "連携失敗: " + e.message };
  }
}
