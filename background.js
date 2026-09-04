// Plasmo picks this up automatically as the MV3 background service worker
// because it's named "background.js" at the project root (or under src/ if
// you have a src directory — keep it wherever your other entry files live).
//
// By default, Chrome's side panel does NOT open when the user clicks the
// extension's toolbar icon — you have to opt in explicitly with
// chrome.sidePanel.setPanelBehavior. Without this file, clicking the icon
// does nothing, and the "Open side panel" entry may not show up in the
// puzzle-piece / 3-dot menu either.

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("[TabExplorer] setPanelBehavior failed:", error))
})

// Also set it on every startup, in case the browser was updated or the
// setting didn't persist (belt-and-suspenders — cheap to call again).
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("[TabExplorer] setPanelBehavior failed:", error))

// --- Session Restoration Feature (Explicit State Machine) ---

let saveTimeout = null;
const SAVE_DELAY = 2000;

// Helper to check if a URL is a "real" tab worth saving
function isRealTab(url) {
  if (!url) return false;
  if (url.startsWith("chrome://newtab")) return false;
  if (url.startsWith("edge://newtab")) return false;
  if (url.startsWith("about:blank")) return false;
  return true;
}

function scheduleSessionSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const tabs = await chrome.tabs.query({});
      const sessionTabs = tabs.map(t => ({ url: t.url, active: t.active, pinned: t.pinned }));
      
      const hasRealTabs = sessionTabs.some(t => isRealTab(t.url));
      
      if (hasRealTabs) {
        await chrome.storage.local.set({ lastKnownSession: sessionTabs });
      }
    } catch (error) {
      console.error("[TabExplorer] Failed to save session:", error);
    }
  }, SAVE_DELAY);
}

// Track tab changes to keep the snapshot up-to-date
chrome.tabs.onCreated.addListener(scheduleSessionSave);
chrome.tabs.onUpdated.addListener(scheduleSessionSave);
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // CRITICAL: If the window is closing, do NOT update the snapshot.
  if (removeInfo.isWindowClosing) return;
  scheduleSessionSave();
});


