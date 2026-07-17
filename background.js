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
