import React, { useState } from "react"
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

export default function Tree({ engine }) {
  const {
    childFolders, childLinks, wsFolders, wsLinks, expanded, setExpanded,
    isSelected, clickSelect, directCount,
    renamingId, renameDraft, setRenameDraft, commitRename, setRenamingId, startRename,
    openContextMenu, query, deleteOne, toggleFolderStarred, clearSelection,
    globalSearchResults, getFolderPath, getWorkspaceName
  } = engine

  // ---------------------------------------------------------------------
  // Normal (non-search) hierarchical tree — scoped to the active workspace.
  // ---------------------------------------------------------------------
  function renderFolder(folder, depth) {
    const isOpen = !!expanded[folder.id]
    const kids = childFolders(folder.id)
    const kidLinks = childLinks(folder.id)
    const count = directCount(folder.id)
    const selected = isSelected("folder", folder.id)
    const renaming = renamingId === `folder:${folder.id}`

    return (
      <div key={folder.id}>
        <div
          className={`row${selected ? " row-selected" : ""}`}
          style={{ paddingLeft: 12 + depth * 16 }}
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
          <FolderGlyph color={folder.color} />
          {renaming ? (
            <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
          ) : (
            <span className="row-label">{folder.name}</span>
          )}
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
        {isOpen && (
          <div>
            {kids.map((f) => renderFolder(f, depth + 1))}
            {kidLinks.map((l) => renderLink(l, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  function renderLink(link, depth) {
    const selected = isSelected("link", link.id)
    const renaming = renamingId === `link:${link.id}`
    return (
      <div
        key={link.id}
        className={`row${selected ? " row-selected" : ""}`}
        style={{ paddingLeft: 12 + depth * 16 + 19 }}
        onClick={(e) => {
          e.stopPropagation()
          clickSelect("link", link.id, e)
        }}
        onDoubleClick={() => {
          if (typeof chrome !== "undefined" && chrome.tabs) chrome.tabs.create({ url: link.url })
        }}
        onContextMenu={(e) => openContextMenu(e, { type: "link", id: link.id })}
      >
        <LinkGlyph link={link} />
        {renaming ? (
          <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
        ) : (
          <span className="row-label link-label">{link.title}</span>
        )}
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

  // ---------------------------------------------------------------------
  // Search results — flat, cross-workspace, no nesting under parent folders.
  // ---------------------------------------------------------------------
  function renderFlatFolder(folder) {
    const selected = isSelected("folder", folder.id)
    const renaming = renamingId === `folder:${folder.id}`
    const count = directCount(folder.id)
    const path = getFolderPath(folder.parentId)
    const wsName = getWorkspaceName(folder.workspaceId)

    return (
      <div
        key={`sf-${folder.id}`}
        className={`row${selected ? " row-selected" : ""}`}
        style={{ paddingLeft: 12 }}
        onClick={(e) => {
          e.stopPropagation()
          clickSelect("folder", folder.id, e)
        }}
        onContextMenu={(e) => openContextMenu(e, { type: "folder", id: folder.id })}
      >
        <FolderGlyph color={folder.color} />
        {renaming ? (
          <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
        ) : (
          <span className="row-label">
            {folder.name}
            <span className="search-path">{wsName}{path ? ` / ${path}` : ""}</span>
          </span>
        )}
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
        <LinkGlyph link={link} />
        {renaming ? (
          <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
        ) : (
          <span className="row-label link-label">
            {link.title}
            <span className="search-path">{wsName}{path ? ` / ${path}` : ""}</span>
          </span>
        )}
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
      <div className="tree" onClick={handleEmptyClick}>
        {matchedFolders.map((f) => renderFlatFolder(f))}
        {matchedLinks.map((l) => renderFlatLink(l))}
        {matchedFolders.length === 0 && matchedLinks.length === 0 && (
          <div className="empty-state">No matching folders or links found.</div>
        )}
      </div>
    )
  }

  return (
    <div className="tree" onClick={handleEmptyClick}>
      {childFolders(null).map((f) => renderFolder(f, 0))}
      {childLinks(null).map((l) => renderLink(l, 0))}
      {wsFolders.length === 0 && wsLinks.length === 0 && (
        <div className="empty-state">No folders yet. Save your current tabs or create a folder to get started.</div>
      )}
    </div>
  )
}
