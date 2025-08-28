chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Inject content.js on click (works in addition to the declared content_script)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (err) {
    console.error("Injection failed:", err);
  }
});
