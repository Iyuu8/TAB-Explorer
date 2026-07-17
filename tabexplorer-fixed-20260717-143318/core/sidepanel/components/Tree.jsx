import React, { useState } from "react"
import { ChevronRight, Folder, Link2, X } from "lucide-react"
import { inferLinkIcon } from "../lib/utils"

function LinkGlyph({ link }) {
  const [broken, setBroken] = useState(false)
  const icon = link.icon || inferLinkIcon(link.url, link.title) || link.favicon
  if (icon && !broken) {
    return <img src={icon} width="14" height="14" onError={() => setBroken(true)} style={{ flexShrink: 0, borderRadius: 2 }} alt="" />
  }
  return <Link2 size={13} className="link-glyph" />
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
    isSelected, clickSelect, countUnder, FOLDER_PALETTE,
    renamingId, renameDraft, setRenameDraft, commitRename, setRenamingId, startRename,
    openContextMenu, query, deleteOne, clearSelection,
    globalSearchResults, getFolderPath, getWorkspaceName
  } = engine

  // ---------------------------------------------------------------------
  // Normal (non-search) hierarchical tree — scoped to the active workspace.
  // ---------------------------------------------------------------------
  function renderFolder(folder, depth) {
    const isOpen = !!expanded[folder.id]
    const kids = childFolders(folder.id)
    const kidLinks = childLinks(folder.id)
    const color = folder.color || FOLDER_PALETTE[depth % FOLDER_PALETTE.length]
    const count = countUnder(folder.id)
    const selected = isSelected("folder", folder.id)
    const renaming = renamingId === `folder:${folder.id}`

    return (
      <div key={folder.id}>
        <div
          className={`row${selected ? " row-selected" : ""}`}
          style={{ paddingLeft: 6 + depth * 16 }}
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
          <Folder size={15} style={{ color, flexShrink: 0 }} fill={color} fillOpacity={0.18} />
          {renaming ? (
            <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
          ) : (
            <span className="row-label">{folder.name}</span>
          )}
          {!renaming && count > 0 && <span className="badge">{count}</span>}
          {!renaming && (
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
        style={{ paddingLeft: 6 + depth * 16 + 19 }}
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
    const count = countUnder(folder.id)
    const path = getFolderPath(folder.parentId)
    const wsName = getWorkspaceName(folder.workspaceId)

    return (
      <div
        key={`sf-${folder.id}`}
        className={`row${selected ? " row-selected" : ""}`}
        style={{ paddingLeft: 6 }}
        onClick={(e) => {
          e.stopPropagation()
          clickSelect("folder", folder.id, e)
        }}
        onContextMenu={(e) => openContextMenu(e, { type: "folder", id: folder.id })}
      >
        <Folder size={15} style={{ color: folder.color || FOLDER_PALETTE[0], flexShrink: 0 }} fill={folder.color || FOLDER_PALETTE[0]} fillOpacity={0.18} />
        {renaming ? (
          <RenameInput value={renameDraft} onChange={setRenameDraft} onCommit={commitRename} onCancel={() => setRenamingId(null)} />
        ) : (
          <span className="row-label">
            {folder.name}
            <span className="search-path">{wsName}{path ? ` / ${path}` : ""}</span>
          </span>
        )}
        {!renaming && count > 0 && <span className="badge">{count}</span>}
        {!renaming && (
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
        style={{ paddingLeft: 6 }}
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
