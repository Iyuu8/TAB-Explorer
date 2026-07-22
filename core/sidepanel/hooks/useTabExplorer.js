import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { loadState, saveState, loadHistory, saveHistory, onStateChanged, normalizeState } from "../lib/storage"
import { BATCH_SIZE, BATCH_DELAY_MS, MAX_HISTORY, FOLDER_PALETTE, makeId, emptyState, inferLinkIcon } from "../lib/utils"

export function useTabExplorer() {
  const [workspaces, setWorkspaces] = useState([])
  const [folders, setFolders] = useState([])
  const [links, setLinks] = useState([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null)
  const [expanded, setExpanded] = useState({})
  // UI-only: which active workspace's tree is collapsed. Not tied to workspace switching.
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState({})
  const [loaded, setLoaded] = useState(false)

  const [search, setSearch] = useState("")
  const [selection, setSelection] = useState([]) // [{type:'folder'|'link'|'workspace', id}]
  const [lastSelected, setLastSelected] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState("")
  const [clipboard, setClipboard] = useState(null) // {mode:'copy'|'cut', items:[{type,id}]}
  const [contextMenu, setContextMenu] = useState(null) // {x,y,target}
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [historyCount, setHistoryCount] = useState(0)

  // -------------------------------------------------------------------
  // Load once, persist on every change
  // -------------------------------------------------------------------
  useEffect(() => {
    Promise.all([loadState(), loadHistory()]).then(([data, history]) => {
      const s = data || emptyState()
      setWorkspaces(s.workspaces || [])
      setFolders(s.folders || [])
      setLinks(s.links || [])
      setActiveWorkspaceId(s.activeWorkspaceId || (s.workspaces[0] && s.workspaces[0].id) || null)
      setExpanded(s.expanded || {})
      historyRef.current = history.slice(-MAX_HISTORY)
      setHistoryCount(historyRef.current.length)
      setLoaded(true)
    })
    // reflect changes made from another view (e.g. full-page command center)
    return onStateChanged((next) => {
      if (!next) return
      setWorkspaces(next.workspaces || [])
      setFolders(next.folders || [])
      setLinks(next.links || [])
      setActiveWorkspaceId((prev) => next.activeWorkspaceId || prev)
      setExpanded(next.expanded || {})
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    const timer = setTimeout(() => {
      saveState({ workspaces, folders, links, activeWorkspaceId, expanded })
    }, 400)
    return () => clearTimeout(timer)
  }, [loaded, workspaces, folders, links, activeWorkspaceId, expanded])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // -------------------------------------------------------------------
  // Undo: snapshot {workspaces, folders, links} before every mutating
  // operation, so "undo" restores the exact previous state.
  // -------------------------------------------------------------------
  const dataRef = useRef({ workspaces: [], folders: [], links: [] })
  useEffect(() => {
    dataRef.current = { workspaces, folders, links }
  }, [workspaces, folders, links])

  const historyRef = useRef([])

  const pushHistory = useCallback(() => {
    historyRef.current.push({
      workspaces: dataRef.current.workspaces,
      folders: dataRef.current.folders,
      links: dataRef.current.links
    })
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
    setHistoryCount(historyRef.current.length)
    saveHistory(historyRef.current)
  }, [])

  const undo = useCallback(() => {
    const prev = historyRef.current.pop()
    setHistoryCount(historyRef.current.length)
    saveHistory(historyRef.current)
    if (!prev) {
      setToast("Nothing to undo")
      return
    }
    setWorkspaces(prev.workspaces)
    setFolders(prev.folders)
    setLinks(prev.links)
    setToast("Undid last action")
  }, [])

  function exportData() {
    const payload = {
      app: "TabExplorer",
      exportedAt: new Date().toISOString(),
      data: normalizeState({ workspaces, folders, links, activeWorkspaceId, expanded })
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tabexplorer-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast("Exported backup")
  }

  function importData(text) {
    try {
      const parsed = JSON.parse(text)
      const candidate = parsed && parsed.data ? parsed.data : parsed
      const next = normalizeState(candidate)
      if (!next || !next.workspaces.length) {
        setToast("Invalid backup file")
        return
      }
      pushHistory()
      setWorkspaces(next.workspaces)
      setFolders(next.folders)
      setLinks(next.links)
      setActiveWorkspaceId(next.activeWorkspaceId || next.workspaces[0].id)
      setExpanded(next.expanded || {})
      setSelection([])
      setLastSelected(null)
      setToast("Imported backup")
    } catch {
      setToast("Could not import backup")
    }
  }

  function resetData() {
    pushHistory()
    const next = emptyState()
    setWorkspaces(next.workspaces)
    setFolders(next.folders)
    setLinks(next.links)
    setActiveWorkspaceId(next.activeWorkspaceId)
    setExpanded(next.expanded)
    setSelection([])
    setLastSelected(null)
    setToast("Reset TabExplorer")
  }

  // -------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------
  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId]
  )

  const query = search.trim().toLowerCase()

  const wsFolders = useMemo(() => folders.filter((f) => f.workspaceId === activeWorkspaceId), [folders, activeWorkspaceId])
  const wsLinks = useMemo(() => links.filter((l) => l.workspaceId === activeWorkspaceId), [links, activeWorkspaceId])

  const sortFolders = useCallback((items) => {
    return [...items].sort((a, b) => {
      if (!!a.starred !== !!b.starred) return a.starred ? -1 : 1
      return (a.createdAt || 0) - (b.createdAt || 0)
    })
  }, [])

  const childFolders = useCallback((parentId) => sortFolders(wsFolders.filter((f) => f.parentId === parentId)), [wsFolders, sortFolders])
  const childLinks = useCallback((parentId) => wsLinks.filter((l) => l.parentId === parentId), [wsLinks])

  const directCount = useCallback(
    (folderId) => childFolders(folderId).length + childLinks(folderId).length,
    [childFolders, childLinks]
  )

  const countUnder = useCallback(
    (folderId) => {
      let count = 0
      const stack = [folderId]
      while (stack.length) {
        const id = stack.pop()
        const subFolders = wsFolders.filter((f) => f.parentId === id)
        const subLinks = wsLinks.filter((l) => l.parentId === id)
        count += subFolders.length + subLinks.length
        subFolders.forEach((f) => stack.push(f.id))
      }
      return count
    },
    [wsFolders, wsLinks]
  )

  const matchesSearch = useCallback((name) => !!name && name.toLowerCase().includes(query), [query])

  // Cross-workspace search: independent of the currently active workspace, so results
  // from every workspace show up together, rendered as a flat list (see Tree.jsx).
  const globalSearchResults = useMemo(() => {
    if (!query) return { folders: [], links: [] }
    const matchedFolders = sortFolders(folders.filter((f) => matchesSearch(f.name)))
    const matchedLinks = links.filter((l) => matchesSearch(l.title) || (l.url || "").toLowerCase().includes(query))
    return { folders: matchedFolders, links: matchedLinks }
  }, [query, folders, links, matchesSearch, sortFolders])

  function getWorkspaceName(workspaceId) {
    const w = workspaces.find((x) => x.id === workspaceId)
    return w ? w.name : ""
  }

  function getFolderPath(folderId) {
    if (!folderId) return ""
    const parts = []
    let current = folders.find((f) => f.id === folderId)
    while (current) {
      parts.unshift(current.name)
      current = current.parentId ? folders.find((f) => f.id === current.parentId) : null
    }
    return parts.join(" / ")
  }

  // Single folder selected -> new items are created inside it (VS Code-style).
  // A workspace selection (or nothing selected) resolves to null, i.e. workspace root.
  const selectedFolderId = selection.length === 1 && selection[0].type === "folder" ? selection[0].id : null

  const flatVisible = useMemo(() => {
    if (query) {
      const out = []
      globalSearchResults.folders.forEach((f) => out.push({ type: "folder", id: f.id }))
      globalSearchResults.links.forEach((l) => out.push({ type: "link", id: l.id }))
      return out
    }
    const out = []
    function walk(parentId) {
      childFolders(parentId).forEach((f) => {
        out.push({ type: "folder", id: f.id })
        if (expanded[f.id]) walk(f.id)
      })
      childLinks(parentId).forEach((l) => {
        out.push({ type: "link", id: l.id })
      })
    }
    walk(null)
    return out
  }, [query, globalSearchResults, childFolders, childLinks, expanded])

  // -------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------
  function isSelected(type, id) {
    return selection.some((s) => s.type === type && s.id === id)
  }

  function clickSelect(type, id, evt) {
    if (evt.shiftKey && lastSelected) {
      const a = flatVisible.findIndex((x) => x.type === lastSelected.type && x.id === lastSelected.id)
      const b = flatVisible.findIndex((x) => x.type === type && x.id === id)
      if (a !== -1 && b !== -1) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        setSelection(flatVisible.slice(lo, hi + 1))
        return
      }
    }
    if (evt.ctrlKey || evt.metaKey) {
      setSelection((prev) =>
        prev.some((s) => s.type === type && s.id === id)
          ? prev.filter((s) => !(s.type === type && s.id === id))
          : [...prev, { type, id }]
      )
      setLastSelected({ type, id })
      return
    }
    // plain single click -> select just this item (folder, link, or workspace row)
    setSelection([{ type, id }])
    setLastSelected({ type, id })
  }

  // Clicking empty space (not a folder/link/workspace row) clears the selection.
  function clearSelection() {
    setSelection([])
    setLastSelected(null)
  }

  function toggleWorkspaceCollapsed(id) {
    setCollapsedWorkspaces((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // -------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------
  function createWorkspace(name) {
    pushHistory()
    const now = Date.now()
    const ws = { id: makeId(), name: name.trim() || "Untitled Workspace", createdAt: now, updatedAt: now }
    setWorkspaces((prev) => [...prev, ws])
    setActiveWorkspaceId(ws.id)
  }

  function makeFolderRecord(name, parentId, now = Date.now()) {
    return {
      id: makeId(),
      workspaceId: activeWorkspaceId,
      parentId: parentId || null,
      name: name.trim() || "New Folder",
      color: "",
      starred: false,
      createdAt: now,
      updatedAt: now
    }
  }

  function createFolder(name, parentId) {
    if (!activeWorkspaceId) return
    pushHistory()
    const now = Date.now()
    const folder = makeFolderRecord(name, parentId, now)
    setFolders((prev) => [...prev, folder])
    if (parentId) setExpanded((prev) => ({ ...prev, [parentId]: true }))
  }

  function createLink(title, url, parentId) {
    if (!activeWorkspaceId || !url.trim()) return
    pushHistory()
    const now = Date.now()
    const cleanTitle = title.trim() || url.trim()
    const cleanUrl = url.trim()
    const link = {
      id: makeId(), workspaceId: activeWorkspaceId, parentId: parentId || null,
      title: cleanTitle, url: cleanUrl, favicon: "", icon: inferLinkIcon(cleanUrl, cleanTitle), createdAt: now, updatedAt: now
    }
    setLinks((prev) => [...prev, link])
    if (parentId) setExpanded((prev) => ({ ...prev, [parentId]: true }))
  }

  function updateFolderColor(id, color) {
    pushHistory()
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, color, updatedAt: Date.now() } : f)))
  }

  function updateFolderDetails(id, name, color, starred) {
    const cleanName = name.trim()
    if (!cleanName) return
    pushHistory()
    setFolders((prev) => prev.map((f) => (
      f.id === id
        ? { ...f, name: cleanName, color, starred, updatedAt: Date.now() }
        : f
    )))
  }

  function toggleFolderStarred(id) {
    pushHistory()
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, starred: !f.starred, updatedAt: Date.now() } : f)))
  }

  function updateWorkspaceName(id, name) {
    const cleanName = name.trim()
    if (!cleanName) return
    pushHistory()
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name: cleanName, updatedAt: Date.now() } : w)))
  }

  function updateLinkDetails(id, title, url, icon) {
    const cleanUrl = url.trim()
    if (!cleanUrl) return
    const cleanTitle = title.trim() || cleanUrl
    pushHistory()
    setLinks((prev) => prev.map((l) => (
      l.id === id
        ? { ...l, title: cleanTitle, url: cleanUrl, icon, updatedAt: Date.now() }
        : l
    )))
  }

  function startRename(type, id, currentName) {
    setRenamingId(`${type}:${id}`)
    setRenameDraft(currentName)
  }

  function commitRename() {
    if (!renamingId) return
    const [type, id] = renamingId.split(":")
    const name = renameDraft.trim()
    if (name) {
      pushHistory()
      if (type === "folder") setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name, updatedAt: Date.now() } : f)))
      else if (type === "link") setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, title: name, updatedAt: Date.now() } : l)))
      else if (type === "workspace") setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name, updatedAt: Date.now() } : w)))
    }
    setRenamingId(null)
    setRenameDraft("")
  }

  function collectDescendants(folderId) {
    const folderIds = [folderId]
    const linkIds = []
    const stack = [folderId]
    while (stack.length) {
      const id = stack.pop()
      folders.filter((f) => f.parentId === id).forEach((f) => {
        folderIds.push(f.id)
        stack.push(f.id)
      })
      links.filter((l) => l.parentId === id).forEach((l) => linkIds.push(l.id))
    }
    return { folderIds, linkIds }
  }

  function deleteItems(items) {
    if (!items.length) return
    pushHistory()
    const foldersToDelete = new Set()
    const linksToDelete = new Set()
    items.forEach((it) => {
      if (it.type === "folder") {
        const { folderIds, linkIds } = collectDescendants(it.id)
        folderIds.forEach((id) => foldersToDelete.add(id))
        linkIds.forEach((id) => linksToDelete.add(id))
      } else if (it.type === "link") {
        linksToDelete.add(it.id)
      }
    })
    setFolders((prev) => prev.filter((f) => !foldersToDelete.has(f.id)))
    setLinks((prev) => prev.filter((l) => !linksToDelete.has(l.id)))
    setSelection((prev) => prev.filter((s) => !items.some((it) => it.type === s.type && it.id === s.id)))
    setToast(`Deleted ${foldersToDelete.size + linksToDelete.size} item(s)`)
  }

  // Quick single-item delete via the row's X icon (independent of multi-select).
  function deleteOne(type, id) {
    deleteItems([{ type, id }])
  }

  function deleteWorkspace(id) {
    pushHistory()
    setWorkspaces((prev) => prev.filter((w) => w.id !== id))
    setFolders((prev) => prev.filter((f) => f.workspaceId !== id))
    setLinks((prev) => prev.filter((l) => l.workspaceId !== id))
    if (activeWorkspaceId === id) {
      const remaining = workspaces.filter((w) => w.id !== id)
      setActiveWorkspaceId(remaining[0] ? remaining[0].id : null)
    }
  }

  // -------------------------------------------------------------------
  // Clipboard
  // -------------------------------------------------------------------
  function copySelection(mode) {
    if (!selection.length) return
    setClipboard({ mode, items: selection })
    setToast(mode === "cut" ? "Cut to clipboard" : "Copied to clipboard")
  }

  function pasteInto(targetFolderId) {
    if (!clipboard || !clipboard.items.length) return
    pushHistory()
    const now = Date.now()

    if (clipboard.mode === "cut") {
      const folderIds = new Set(clipboard.items.filter((i) => i.type === "folder").map((i) => i.id))
      const linkIds = new Set(clipboard.items.filter((i) => i.type === "link").map((i) => i.id))
      folderIds.forEach((fid) => {
        const { folderIds: desc } = collectDescendants(fid)
        if (desc.includes(targetFolderId)) folderIds.delete(fid) // no dropping a folder into itself
      })
      setFolders((prev) => prev.map((f) => (folderIds.has(f.id) ? { ...f, parentId: targetFolderId, updatedAt: now } : f)))
      setLinks((prev) => prev.map((l) => (linkIds.has(l.id) ? { ...l, parentId: targetFolderId, updatedAt: now } : l)))
      setClipboard(null)
    } else {
      const newFolders = []
      const newLinks = []
      function duplicateFolder(sourceId, newParentId) {
        const src = folders.find((f) => f.id === sourceId)
        if (!src) return
        const clone = { ...src, id: makeId(), parentId: newParentId, createdAt: now, updatedAt: now }
        newFolders.push(clone)
        folders.filter((f) => f.parentId === sourceId).forEach((f) => duplicateFolder(f.id, clone.id))
        links.filter((l) => l.parentId === sourceId).forEach((l) => newLinks.push({ ...l, id: makeId(), parentId: clone.id, createdAt: now, updatedAt: now }))
      }
      clipboard.items.forEach((it) => {
        if (it.type === "folder") duplicateFolder(it.id, targetFolderId)
        else {
          const src = links.find((l) => l.id === it.id)
          if (src) newLinks.push({ ...src, id: makeId(), parentId: targetFolderId, createdAt: now, updatedAt: now })
        }
      })
      setFolders((prev) => [...prev, ...newFolders])
      setLinks((prev) => [...prev, ...newLinks])
    }
    setToast("Pasted")
    if (targetFolderId) setExpanded((prev) => ({ ...prev, [targetFolderId]: true }))
  }

  function pasteTargetFolderId() {
    if (selection.length === 1 && selection[0].type === "folder") return selection[0].id
    return null
  }

  // -------------------------------------------------------------------
  // Drag & drop: move folders/links directly to a new parent (or the
  // workspace root when targetFolderId is null), without going through
  // the clipboard. Shares the same "no dropping a folder into itself or
  // its own descendants" guard as cut/paste.
  // -------------------------------------------------------------------
  function moveItems(items, targetFolderId) {
    if (!items || !items.length) return

    const folderItems = items.filter((i) => i.type === "folder")
    const linkItems = items.filter((i) => i.type === "link")

    const validFolderIds = new Set(
      folderItems
        .filter((i) => i.id !== targetFolderId)
        .filter((i) => {
          const { folderIds: desc } = collectDescendants(i.id)
          return !desc.includes(targetFolderId)
        })
        .map((i) => i.id)
    )
    const validLinkIds = new Set(linkItems.map((i) => i.id))

    const changedFolders = folders.some((f) => validFolderIds.has(f.id) && f.parentId !== targetFolderId)
    const changedLinks = links.some((l) => validLinkIds.has(l.id) && l.parentId !== targetFolderId)
    if (!changedFolders && !changedLinks) return

    pushHistory()
    const now = Date.now()
    setFolders((prev) => prev.map((f) => (validFolderIds.has(f.id) ? { ...f, parentId: targetFolderId, updatedAt: now } : f)))
    setLinks((prev) => prev.map((l) => (validLinkIds.has(l.id) ? { ...l, parentId: targetFolderId, updatedAt: now } : l)))
    if (targetFolderId) setExpanded((prev) => ({ ...prev, [targetFolderId]: true }))
    setToast(`Moved ${validFolderIds.size + validLinkIds.size} item(s)`)
  }

  // -------------------------------------------------------------------
  // Chrome tabs integration
  // -------------------------------------------------------------------
  function queryCurrentTabs() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.tabs) {
        resolve([])
        return
      }
      chrome.tabs.query({ currentWindow: true }, (tabs) => resolve(tabs || []))
    })
  }

  async function saveTabs(targetFolderId, mode) {
    const tabs = await queryCurrentTabs()
    const realTabs = tabs.filter((t) => t.url && !t.url.startsWith("chrome://"))
    const existing = links.filter((l) => l.parentId === targetFolderId)
    const existingUrls = new Set(existing.map((l) => l.url))

    pushHistory()

    if (mode === "replace") {
      const idsToRemove = new Set(existing.map((l) => l.id))
      setLinks((prev) => prev.filter((l) => !idsToRemove.has(l.id)))
    }

    const now = Date.now()
    const toAdd = []
    let skipped = 0
    realTabs.forEach((t) => {
      if (mode === "append" && existingUrls.has(t.url)) {
        skipped += 1
        return
      }
      toAdd.push({
        id: makeId(), workspaceId: activeWorkspaceId, parentId: targetFolderId,
        title: t.title || t.url, url: t.url, favicon: t.favIconUrl || "", icon: inferLinkIcon(t.url, t.title || t.url),
        createdAt: now, updatedAt: now
      })
    })
    setLinks((prev) => [...prev, ...toAdd])
    if (targetFolderId) setExpanded((prev) => ({ ...prev, [targetFolderId]: true }))
    setToast(`Saved ${toAdd.length} tab(s)${skipped ? ` · skipped ${skipped} duplicate(s)` : ""}`)
    setModal(null)
  }

  async function saveTabsToNewFolder(folderName, mode) {
    if (!activeWorkspaceId) return
    const tabs = await queryCurrentTabs()
    const realTabs = tabs.filter((t) => t.url && !t.url.startsWith("chrome://"))
    const now = Date.now()
    const folder = makeFolderRecord(folderName, null, now)

    pushHistory()

    const toAdd = realTabs.map((t) => ({
      id: makeId(), workspaceId: activeWorkspaceId, parentId: folder.id,
      title: t.title || t.url, url: t.url, favicon: t.favIconUrl || "", icon: inferLinkIcon(t.url, t.title || t.url),
      createdAt: now, updatedAt: now
    }))

    setFolders((prev) => [...prev, folder])
    setLinks((prev) => [...prev, ...toAdd])
    setExpanded((prev) => ({ ...prev, [folder.id]: true }))
    setToast(`Created "${folder.name}" and saved ${toAdd.length} tab(s)`)
    setModal(null)
  }

  // Accepts either a single target ({type, id}) or an array of targets (multi-select "Open").
  // Results are de-duplicated by link id so overlapping selections (e.g. a folder and one
  // of its own links both selected) don't open the same tab twice.
  function collectLinksForOpen(target) {
    if (Array.isArray(target)) {
      const seen = new Set()
      const collected = []
      target.forEach((t) => {
        collectLinksForOpen(t).forEach((l) => {
          if (!seen.has(l.id)) {
            seen.add(l.id)
            collected.push(l)
          }
        })
      })
      return collected
    }
    if (target.type === "workspace") return links.filter((l) => l.workspaceId === target.id)
    if (target.type === "link") {
      const l = links.find((x) => x.id === target.id)
      return l ? [l] : []
    }
    const { linkIds } = collectDescendants(target.id)
    return links.filter((l) => linkIds.includes(l.id))
  }

  function openTabsBatched(urlList) {
    if (typeof chrome === "undefined" || !chrome.tabs) return
    let i = 0
    function openNext() {
      const batch = urlList.slice(i, i + BATCH_SIZE)
      batch.forEach((url) => chrome.tabs.create({ url, active: false }))
      i += BATCH_SIZE
      if (i < urlList.length) setTimeout(openNext, BATCH_DELAY_MS)
    }
    openNext()
  }

  function requestOpen(target) {
    const targetLinks = collectLinksForOpen(target)
    if (!targetLinks.length) {
      setToast("Nothing to open")
      return
    }
    if (targetLinks.length > BATCH_SIZE) {
      setModal({ type: "batchWarning", target, count: targetLinks.length })
      return
    }
    openTabsBatched(targetLinks.map((l) => l.url))
  }

  // Opens exactly the set of items the user multi-selected (folders and/or links),
  // instead of silently falling back to "open the whole workspace".
  function requestOpenMultiple(items) {
    const targetLinks = collectLinksForOpen(items)
    if (!targetLinks.length) {
      setToast("Nothing to open")
      return
    }
    if (targetLinks.length > BATCH_SIZE) {
      setModal({ type: "batchWarning", target: items, count: targetLinks.length })
      return
    }
    openTabsBatched(targetLinks.map((l) => l.url))
  }

  // -------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------
  useEffect(() => {
    function onKeyDown(e) {
      if (renamingId) return
      const tag = (e.target && e.target.tagName) || ""
      if (tag === "INPUT" || tag === "TEXTAREA") return

      const cmd = e.ctrlKey || e.metaKey
      if (cmd && e.key.toLowerCase() === "a") {
        e.preventDefault()
        setSelection(flatVisible)
      } else if (cmd && e.key.toLowerCase() === "c") {
        e.preventDefault()
        copySelection("copy")
      } else if (cmd && e.key.toLowerCase() === "x") {
        e.preventDefault()
        copySelection("cut")
      } else if (cmd && e.key.toLowerCase() === "v") {
        e.preventDefault()
        pasteInto(pasteTargetFolderId())
      } else if (cmd && e.key.toLowerCase() === "z") {
        e.preventDefault()
        undo()
      } else if (cmd && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault()
        setModal({ type: "saveTabs", targetId: selectedFolderId, targetIsWorkspace: !selectedFolderId })
      } else if (e.key === "Escape") {
        clearSelection()
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selection.length) {
          e.preventDefault()
          deleteItems(selection)
        }
      } else if (e.key === "F2") {
        if (selection.length === 1) {
          const sel = selection[0]
          const item = sel.type === "folder" ? folders.find((f) => f.id === sel.id) : links.find((l) => l.id === sel.id)
          if (item) startRename(sel.type, sel.id, sel.type === "folder" ? item.name : item.title)
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, flatVisible, clipboard, renamingId, folders, links, selectedFolderId])

  // -------------------------------------------------------------------
  // Context menu
  // -------------------------------------------------------------------
  function openContextMenu(e, target) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, target })
  }

  useEffect(() => {
    function closeOnOutsidePointerDown(e) {
      if (e.target && e.target.closest && e.target.closest(".ctx-menu")) return
      setContextMenu(null)
    }
    window.addEventListener("pointerdown", closeOnOutsidePointerDown, true)
    return () => window.removeEventListener("pointerdown", closeOnOutsidePointerDown, true)
  }, [])

  return {
    // data
    workspaces, folders, links, activeWorkspaceId, activeWorkspace, expanded, loaded,
    wsFolders, wsLinks, childFolders, childLinks, directCount, countUnder, matchesSearch, query,
    globalSearchResults, getWorkspaceName, getFolderPath,
    FOLDER_PALETTE,
    // workspace collapse (independent of the workspace switcher)
    collapsedWorkspaces, toggleWorkspaceCollapsed,
    // selection
    selection, isSelected, clickSelect, clearSelection, selectedFolderId, setSelection,
    // rename
    renamingId, renameDraft, setRenameDraft, startRename, commitRename, setRenamingId,
    // search
    search, setSearch,
    // clipboard
    clipboard, copySelection, pasteInto, pasteTargetFolderId,
    // drag & drop
    moveItems,
    // context menu
    contextMenu, openContextMenu, setContextMenu,
    // modal
    modal, setModal,
    // toast
    toast, setToast,
    // backup
    exportData, importData, resetData,
    // crud
    createWorkspace, createFolder, createLink, updateFolderColor, updateFolderDetails, toggleFolderStarred, updateLinkDetails, updateWorkspaceName, deleteItems, deleteOne, deleteWorkspace,
    setActiveWorkspaceId, setExpanded,
    // tabs
    saveTabs, saveTabsToNewFolder, requestOpen, requestOpenMultiple, collectLinksForOpen, openTabsBatched,
    // undo
    undo, historyCount
  }
}
