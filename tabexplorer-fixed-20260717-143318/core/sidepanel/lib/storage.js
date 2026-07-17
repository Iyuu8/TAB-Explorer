// Persistence layer — everything the panel shows is backed by chrome.storage.local
// so it survives closing the side panel, closing the browser, or reloading the extension.

export const STORAGE_KEY = "tabExplorerData"

export function loadState() {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      resolve(null)
      return
    }
    chrome.storage.local.get([STORAGE_KEY], (res) => {
      resolve(res && res[STORAGE_KEY] ? res[STORAGE_KEY] : null)
    })
  })
}

export function saveState(state) {
  if (typeof chrome === "undefined" || !chrome.storage) return
  chrome.storage.local.set({ [STORAGE_KEY]: state })
}

// Optional: live-update the panel if data changes in another view (e.g. the full-page
// command center) while this side panel is open.
export function onStateChanged(callback) {
  if (typeof chrome === "undefined" || !chrome.storage) return () => {}
  function listener(changes, area) {
    if (area === "local" && changes[STORAGE_KEY]) {
      callback(changes[STORAGE_KEY].newValue)
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
