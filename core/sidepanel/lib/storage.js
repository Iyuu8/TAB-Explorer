// Persistence layer — everything the panel shows is backed by chrome.storage.local
// so it survives closing the side panel, closing the browser, or reloading the extension.

export const STORAGE_KEY = "tabExplorerData"
export const HISTORY_KEY = "tabExplorerHistory"
export const DATA_VERSION = 1

function isArray(value) {
  return Array.isArray(value) ? value : []
}

export function normalizeState(raw) {
  if (!raw || typeof raw !== "object") return null
  const state = raw.version ? raw : { ...raw, version: DATA_VERSION }
  const workspaces = isArray(state.workspaces)
  const folders = isArray(state.folders)
  const links = isArray(state.links)
  return {
    version: DATA_VERSION,
    workspaces,
    folders: folders.map((folder) => ({
      ...folder,
      parentId: folder.parentId || null,
      color: folder.color || "",
      starred: !!folder.starred
    })),
    links: links.map((link) => ({
      ...link,
      parentId: link.parentId || null,
      favicon: link.favicon || "",
      icon: link.icon || ""
    })),
    activeWorkspaceId: state.activeWorkspaceId || (workspaces[0] && workspaces[0].id) || null,
    expanded: state.expanded && typeof state.expanded === "object" ? state.expanded : {}
  }
}

export function normalizeHistory(raw) {
  return isArray(raw)
    .filter((snapshot) => snapshot && typeof snapshot === "object")
    .map((snapshot) => ({
      workspaces: isArray(snapshot.workspaces),
      folders: isArray(snapshot.folders),
      links: isArray(snapshot.links)
    }))
}

export function loadState() {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      resolve(null)
      return
    }
    chrome.storage.local.get([STORAGE_KEY], (res) => {
      resolve(res && res[STORAGE_KEY] ? normalizeState(res[STORAGE_KEY]) : null)
    })
  })
}

export function saveState(state) {
  if (typeof chrome === "undefined" || !chrome.storage) return
  chrome.storage.local.set({ [STORAGE_KEY]: normalizeState(state) })
}

export function loadHistory() {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      resolve([])
      return
    }
    chrome.storage.local.get([HISTORY_KEY], (res) => {
      resolve(normalizeHistory(res && res[HISTORY_KEY]))
    })
  })
}

export function saveHistory(history) {
  if (typeof chrome === "undefined" || !chrome.storage) return
  chrome.storage.local.set({ [HISTORY_KEY]: normalizeHistory(history) })
}

export function clearHistory() {
  if (typeof chrome === "undefined" || !chrome.storage) return
  chrome.storage.local.remove([HISTORY_KEY])
}

// Optional: live-update the panel if data changes in another view (e.g. the full-page
// command center) while this side panel is open.
export function onStateChanged(callback) {
  if (typeof chrome === "undefined" || !chrome.storage) return () => {}
  function listener(changes, area) {
    if (area === "local" && changes[STORAGE_KEY]) {
      callback(normalizeState(changes[STORAGE_KEY].newValue))
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
