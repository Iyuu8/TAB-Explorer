// Tree.jsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import { ChevronRight, Star, X } from "lucide-react"
import { inferLinkIcon } from "../lib/utils"

function LinkGlyph({ link }) {
  const [broken, setBroken] = useState(false)
  const icon = link.icon || inferLinkIcon(link.url, link.title) || link.favicon
  if (icon && !broken) {
    return <img src={icon} width="12" height="12" onError={() => setBroken(true)} style={{ flexShrink: 0, borderRadius: 2 }} alt="" />
  }
  const fallback = (link.title || link.url || "?").trim().charAt(0).toUpperCase()
  return <span className="link-fallback" title={link.url}>{fallback}</span>
}

function darkerFolderBack(frontColor) {
  const hex = (frontColor || "#2B2B2B").replace("#", "")
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#242424"
  const ratio = 0x24 / 0x2b
  const channels = [0, 2, 4].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16)
    return Math.max(0, Math.min(255, Math.round(value * ratio))).toString(16).padStart(2, "0")
  })
  return `#${channels.join("")}`
}

function FolderGlyph({ color }) {
  const front = color || "#2B2B2B"
  const back = darkerFolderBack(front)
  return (
    <svg viewBox="0 0 16 13" className="folder-glyph" aria-hidden="true">
      <path d="M0 2.4C0 1.4 0.8 0.6 1.8 0.6H6L7.4 2H14.2C15.2 2 16 2.8 16 3.8V10.6C16 11.6 15.2 12.4 14.2 12.4H1.8C0.8 12.4 0 11.6 0 10.6V2.4Z" fill={back} />
      <path d="M0 4.2H16V10.6C16 11.6 15.2 12.4 14.2 12.4H1.8C0.8 12.4 0 11.6 0 10.6V4.2Z" fill={front} />
    </svg>
  )
}

function RenameInput({ value, onChange, onCommit, onCancel }) {
  return (
    <input
      autoFocus
      className="rename-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit()
        if (e.key === "Escape") onCancel()
      }}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

// Builds a stable key for drag-over tracking so folder ids and link ids
// (and the special "root" target) can never collide.
function dragKey(type, id) {
  return `${type}:${id}`
}

// How close (in px) the pointer must be to the top/bottom edge of the
// scrollable tree container before we start auto-scrolling during a drag.
const AUTO_SCROLL_THRESHOLD = 48
const AUTO_SCROLL_STEP = 4

export default function Tree({ engine }) {
  const {
    childFolders, childLinks, wsFolders, wsLinks, expanded, setExpanded,
    isSelected, clickSelect, directCount, selection, selectedFolderId,
    renamingId, renameDraft, setRenameDraft, commitRename, setRenamingId, startRename,
    openContextMenu, query, deleteOne, toggleFolderStarred, clearSelection,
    globalSearchResults, getFolderPath, getWorkspaceName,
    globalChildFolders, globalChildLinks, globalDirectCount,
    moveItems
  } = engine

  const [hoveredFolderId, setHoveredFolderId] = useState(null)
  const scopeFolderId = hoveredFolderId || selectedFolderId

  // Drag & drop UI state (purely visual — the actual mutation lives in moveItems).
  const [dragOverKey, setDragOverKey] = useState(null)
  // Set of dragKey(type,id) for every item currently being dragged, so a
  // multi-select drag highlights all of them, not just the row the gesture
  // started on.
  const [draggingKeys, setDraggingKeys] = useState(null)
  // Tracks the pointer's last clientY during drag so a continuous auto-scroll
  // loop (see effect below) can run independently of dragover event frequency.
  const lastDragY = useRef(null)

  const treeContainerRef = useRef(null)

  const scopeIds = useMemo(() => {
    const folderSet = new Set()
    const linkSet = new Set()
    if (!scopeFolderId) return { folders: folderSet, links: linkSet }
    const stack = [scopeFolderId]
    while (stack.length) {
      const id = stack.pop()
      childFolders(id).forEach((f) => {
        folderSet.add(f.id)
        stack.push(f.id)
      })
      childLinks(id).forEach((l) => linkSet.add(l.id))
    }
    return { folders: folderSet, links: linkSet }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeFolderId, childFolders, childLinks, wsFolders, wsLinks])

  function autoScrollOnDrag(e) {
    lastDragY.current = e.clientY
  }

  // Runs a continuous scroll loop for the duration of a drag, independent of
  // how often dragover fires (Chrome suppresses wheel entirely during native
  // drag, so this is the only way to scroll the list while dragging).
  useEffect(() => {
    if (draggingKeys === null) return
    let raf
    function tick() {
      const el = treeContainerRef.current
      const y = lastDragY.current
      if (el && y !== null) {
        const rect = el.getBoundingClientRect()
        if (y - rect.top < AUTO_SCROLL_THRESHOLD) {
          el.scrollTop = Math.max(0, el.scrollTop - AUTO_SCROLL_STEP)
        } else if (rect.bottom - y < AUTO_SCROLL_THRESHOLD) {
          el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + AUTO_SCROLL_STEP)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [draggingKeys])

  function handleDragStart(e, type, id) {
    e.stopPropagation()
    const items = isSelected(type, id) && selection.length > 1 ? selection : [{ type, id }]
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", JSON.stringify(items))
    setDraggingKeys(new Set(items.map((it) => dragKey(it.type, it.id))))

    if (items.length > 1) {
      const preview = document.createElement("div")
      preview.textContent = `${items.length} items`
      preview.style.cssText = `
        position: absolute; top: -1000px; left: -1000px;
        padding: 4px 10px; background: var(--selected-bg); color: var(--selected-fg);
        font-size: 12px; font-family: inherit; border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap;
      `
      document.body.appendChild(preview)
      e.dataTransfer.setDragImage(preview, 14, 14)
      setTimeout(() => document.body.removeChild(preview), 0)
    }
  }

  function handleDragEnd() {
    setDraggingKeys(null)
    setDragOverKey(null)
  }

  function handleDragOverTarget(e, key) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    setDragOverKey(key)
    autoScrollOnDrag(e)
  }

  function handleDragLeaveTarget(e, key) {
    e.stopPropagation()
    setDragOverKey((prev) => (prev === key ? null : prev))
  }

  function handleDropTarget(e, targetFolderId) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverKey(null)
    setDraggingKeys(null)
    const raw = e.dataTransfer.getData("text/plain")
    if (!raw) return
    try {
      const items = JSON.parse(raw)
      moveItems(items, targetFolderId)
    } catch {
      // ignore malformed payloads (e.g. a drag originating outside the app)
    }
  }

  function handleTreeDragOver(e) {
    e.preventDefault()
    setDragOverKey("__root__")
    autoScrollOnDrag(e)
  }

  function handleTreeDragLeave(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return
    setDragOverKey((prev) => (prev === "__root__" ? null : prev))
  }

  function handleTreeDrop(e) {
    handleDropTarget(e, null)
  }

  // ---------------------------------------------------------------------
  // Normal (non-search) hierarchical tree — scoped to the active workspace.
  // ---------------------------------------------------------------------
  function renderFolder(folder, depth, global = false) {
    const isOpen = !!expanded[folder.id]
    const kids = global ? globalChildFolders(folder.id) : childFolders(folder.id)
    const kidLinks = global ? globalChildLinks(folder.id) : childLinks(folder.id)
    const count = global ? globalDirectCount(folder.id) : directCount(folder.id)
    const selected = isSelected("folder", folder.id)
    const renaming = renamingId === `folder:${folder.id}`
    const inScope = global ? false : scopeIds.folders.has(folder.id)
    const key = dragKey("folder", folder.id)
    const isDropTarget = global ? false : dragOverKey === key
    const isDragging = global ? false : draggingKeys ? draggingKeys.has(key) : false

    return (
      <div key={folder.id}>
        <div
          className={`row${selected ? " row-selected" : ""}${inScope ? " row-in-scope" : ""}${isDropTarget ? " row-drop-target" : ""}${isDragging ? " row-dragging" : ""}`}
          style={{ paddingLeft: 12 + depth * 16 }}
          onClick={(e) => {
            e.stopPropagation()
            clickSelect("folder", folder.id, e)
          }}
          onContextMenu={(e) => openContextMenu(e, { type: "folder", id: folder.id })}
          onMouseEnter={() => setHoveredFolderId(folder.id)}
          onMouseLeave={() => setHoveredFolderId((prev) => (prev === folder.id ? null : prev))}
          {...(!global ? {
            onDragOver: (e) => handleDragOverTarget(e, key),
            onDragLeave: (e) => handleDragLeaveTarget(e, key),
            onDrop: (e) => handleDropTarget(e, folder.id)
          } : {})}
        >
          {/* Dedicated, wider hitbox toggle — never part of the draggable content. */}
          <button
            className="chevron-btn"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((prev) => ({ ...prev, [folder.id]: !prev[folder.id] }))
            }}
          >
            <ChevronRight size={13} style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .12s ease" }} />
          </button>

          {/* Drag is scoped to the content element only, so the chevron never
              accidentally starts a drag and always toggles reliably. */}
          <div
            className="row-content"
            draggable={!renaming && !global}
            {...(!global ? {
              onDragStart: (e) => handleDragStart(e, "folder", folder.id),
              onDragEnd: handleDragEnd
            } : {})}
          >
            <FolderGlyph color={folder.color} />
            {renaming ? (
              <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
            ) : (
              <span className="row-label">{folder.name}</span>
            )}
          </div>

          {!renaming && (
            <span className="folder-actions">
              <button
                className="row-delete"
                title="Delete"
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteOne("folder", folder.id)
                }}
              >
                <X size={13} />
              </button>
              <button
                className={`star-btn${folder.starred ? " star-btn-active" : ""}`}
                title={folder.starred ? "Unstar folder" : "Star folder"}
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolderStarred(folder.id)
                }}
              >
                <Star size={13} className="star-icon" />
              </button>
              <span className="badge">{count}</span>
            </span>
          )}
        </div>
        {isOpen && (
          <div className="tree-guide" style={{ "--guide-left": `${24 + depth * 16}px` }}>
            {kids.map((f) => renderFolder(f, depth + 1, global))}
            {kidLinks.map((l) => renderLink(l, depth + 1, global))}
          </div>
        )}
      </div>
    )
  }

  function renderLink(link, depth, global = false) {
    const selected = isSelected("link", link.id)
    const renaming = renamingId === `link:${link.id}`
    const inScope = global ? false : scopeIds.links.has(link.id)
    const key = dragKey("link", link.id)
    const isDropTarget = global ? false : dragOverKey === key
    const isDragging = global ? false : draggingKeys ? draggingKeys.has(key) : false

    return (
      <div
        key={link.id}
        className={`row${selected ? " row-selected" : ""}${inScope ? " row-in-scope" : ""}${isDropTarget ? " row-drop-target" : ""}${isDragging ? " row-dragging" : ""}`}
        style={{ paddingLeft: 12 + depth * 16 + 19 }}
        onClick={(e) => {
          e.stopPropagation()
          clickSelect("link", link.id, e)
        }}
        onDoubleClick={() => {
          if (typeof chrome !== "undefined" && chrome.tabs) chrome.tabs.create({ url: link.url })
        }}
        onContextMenu={(e) => openContextMenu(e, { type: "link", id: link.id })}
        {...(!global ? {
          onDragOver: (e) => handleDragOverTarget(e, key),
          onDragLeave: (e) => handleDragLeaveTarget(e, key),
          onDrop: (e) => handleDropTarget(e, link.parentId || null)
        } : {})}
      >
        <div
            className="row-content"
            draggable={!renaming && !global}
            {...(!global ? {
              onDragStart: (e) => handleDragStart(e, "folder", folder.id),
              onDragEnd: handleDragEnd
            } : {})}
          >
          <LinkGlyph link={link} />
          {renaming ? (
            <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
          ) : (
            <span className="row-label link-label">{link.title}</span>
          )}
        </div>
        {!renaming && (
          <button
            className="row-delete"
            title="Delete"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation()
              deleteOne("link", link.id)
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------
  // Search results — flat, cross-workspace, no nesting under parent folders.
  // Drag & drop is intentionally not wired here: dragging a hit into a
  // folder from a different workspace would leave its workspaceId out of
  // sync with its new parent, breaking the flat-model workspace scoping.
  // ---------------------------------------------------------------------
  function renderFlatFolder(folder) {
    const selected = isSelected("folder", folder.id)
    const renaming = renamingId === `folder:${folder.id}`
    const isOpen = !!expanded[folder.id]
    // Global (workspace-agnostic) count/children — this folder may not belong
    // to the currently active workspace at all.
    const count = globalDirectCount(folder.id)
    const path = getFolderPath(folder.parentId)
    const wsName = getWorkspaceName(folder.workspaceId)

    return (
      <div key={`sf-${folder.id}`}>
        <div
          className={`row${selected ? " row-selected" : ""}`}
          style={{ paddingLeft: 12 }}
          onClick={(e) => {
            e.stopPropagation()
            clickSelect("folder", folder.id, e)
          }}
          onContextMenu={(e) => openContextMenu(e, { type: "folder", id: folder.id })}
        >
          <button
            className="chevron-btn"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((prev) => ({ ...prev, [folder.id]: !prev[folder.id] }))
            }}
          >
            <ChevronRight size={13} style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .12s ease" }} />
          </button>
          <div className="row-content">
            <FolderGlyph color={folder.color} />
            {renaming ? (
              <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
            ) : (
              <span className="row-label">
                {folder.name}
                <span className="search-path">{wsName}{path ? ` / ${path}` : ""}</span>
              </span>
            )}
          </div>
          {!renaming && (
            <span className="folder-actions">
              <button
                className="row-delete"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteOne("folder", folder.id)
                }}
              >
                <X size={13} />
              </button>
              <button
                className={`star-btn${folder.starred ? " star-btn-active" : ""}`}
                title={folder.starred ? "Unstar folder" : "Star folder"}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolderStarred(folder.id)
                }}
              >
                <Star size={13} className="star-icon" />
              </button>
              <span className="badge">{count}</span>
            </span>
          )}
        </div>
        {/* Expanded contents render via the normal folder/link renderers in
            "global" mode: read-only (no drag) since a search hit's children
            may belong to a different workspace than the active one. */}
        {isOpen && (
          <div className="tree-guide" style={{ "--guide-left": "24px" }}>
            {globalChildFolders(folder.id).map((f) => renderFolder(f, 1, true))}
            {globalChildLinks(folder.id).map((l) => renderLink(l, 1, true))}
          </div>
        )}
      </div>
    )
  }

  function renderFlatLink(link) {
    const selected = isSelected("link", link.id)
    const renaming = renamingId === `link:${link.id}`
    const path = getFolderPath(link.parentId)
    const wsName = getWorkspaceName(link.workspaceId)

    return (
      <div
        key={`sl-${link.id}`}
        className={`row${selected ? " row-selected" : ""}`}
        style={{ paddingLeft: 12 }}
        onClick={(e) => {
          e.stopPropagation()
          clickSelect("link", link.id, e)
        }}
        onDoubleClick={() => {
          if (typeof chrome !== "undefined" && chrome.tabs) chrome.tabs.create({ url: link.url })
        }}
        onContextMenu={(e) => openContextMenu(e, { type: "link", id: link.id })}
      >
        <div className="row-content">
          <LinkGlyph link={link} />
          {renaming ? (
            <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
          ) : (
            <span className="row-label link-label">
              {link.title}
              <span className="search-path">{wsName}{path ? ` / ${path}` : ""}</span>
            </span>
          )}
        </div>
        {!renaming && (
          <button
            className="row-delete"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation()
              deleteOne("link", link.id)
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    )
  }

  // Clicking empty tree space (not any row) clears selection. Rows stopPropagation()
  // so this only fires on genuine empty-area clicks.
  function handleEmptyClick(e) {
    e.stopPropagation()
    clearSelection()
  }

  if (query) {
    const { folders: matchedFolders, links: matchedLinks } = globalSearchResults
    return (
      <div className="tree" ref={treeContainerRef} onClick={handleEmptyClick}>
        {matchedFolders.map((f) => renderFlatFolder(f))}
        {matchedLinks.map((l) => renderFlatLink(l))}
        {matchedFolders.length === 0 && matchedLinks.length === 0 && (
          <div className="empty-state">No matching folders or links found.</div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`tree${dragOverKey === "__root__" ? " tree-drop-target" : ""}`}
      ref={treeContainerRef}
      onClick={handleEmptyClick}
      onMouseLeave={() => setHoveredFolderId(null)}
      onDragOver={handleTreeDragOver}
      onDragLeave={handleTreeDragLeave}
      onDrop={handleTreeDrop}
    >
      {childFolders(null).map((f) => renderFolder(f, 0))}
      {childLinks(null).map((l) => renderLink(l, 0))}
      {wsFolders.length === 0 && wsLinks.length === 0 && (
        <div className="empty-state">No folders yet. Save your current tabs or create a folder to get started.</div>
      )}
    </div>
  )
}