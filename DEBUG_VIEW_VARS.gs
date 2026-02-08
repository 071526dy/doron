function debugViewEmail() {
  const email = Session.getActiveUser().getEmail();
  const effectiveEmail = Session.getEffectiveUser().getEmail();
  const props = PropertiesService.getScriptProperties();
  const lockedAccount = props.getProperty('LOCKED_ACCOUNT');
  
  console.log("=== EMAIL DEBUG ===");
  console.log("Active User Email:", email);
  console.log("Effective User Email:", effectiveEmail);
  console.log("LOCKED_ACCOUNT Prop:", lockedAccount);
  
  return {
    active: email,
    effective: effectiveEmail,
    locked: lockedAccount
  };
}

function debugResetLockedAccount() {
  const props = PropertiesService.getScriptProperties();
  const current = props.getProperty('LOCKED_ACCOUNT');
  console.log("Resetting LOCKED_ACCOUNT from:", current);
  props.deleteProperty('LOCKED_ACCOUNT');
  return "Locked account property deleted. Was: " + current;
}
