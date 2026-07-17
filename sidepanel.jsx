import React, { useRef } from "react"
import { Maximize2, FolderPlus, Link2, ChevronRight } from "lucide-react"

import logo from "./assets/logo.png"
import "./core/sidepanel/sidepanel.css"

import { useTabExplorer } from "./core/sidepanel/hooks/useTabExplorer"
import Toolbar from "./core/sidepanel/components/Toolbar"
import WorkspaceSwitcher from "./core/sidepanel/components/WorkspaceSwitcher"
import SearchBar from "./core/sidepanel/components/SearchBar"
import Tree from "./core/sidepanel/components/Tree"
import ContextMenu from "./core/sidepanel/components/ContextMenu"
import Modal from "./core/sidepanel/components/Modal"

// =====================================================================================
// TabExplorer — Side Panel (Surface A)
// Tier-1 / v1 MVP base operations only (see Cahier des Charges §5.2, §7.1).
// All state is centralized in useTabExplorer() and persisted to chrome.storage.local,
// so everything saved here is still there next time the panel (or the browser) opens.
// =====================================================================================

export default function SidePanel() {
  const engine = useTabExplorer()
  const importInputRef = useRef(null)
  const {
    workspaces, activeWorkspace, activeWorkspaceId, loaded,
    selection, selectedFolderId,
    clickSelect, isSelected, clearSelection,
    search, setSearch,
    contextMenu, openContextMenu, setContextMenu,
    modal, setModal,
    toast,
    clipboard, copySelection, pasteInto,
    createWorkspace, createFolder, createLink, deleteItems, deleteWorkspace,
    setActiveWorkspaceId,
    saveTabs, saveTabsToNewFolder, requestOpen, requestOpenMultiple, collectLinksForOpen, openTabsBatched,
    undo, historyCount,
    folders, links, startRename,
    collapsedWorkspaces, toggleWorkspaceCollapsed
  } = engine

  if (!loaded) {
    return <div className="panel-root loading">Loading TabExplorer…</div>
  }

  function onSaveTabsClick() {
    if (!activeWorkspaceId) return
    setModal({ type: "saveTabs", targetId: selectedFolderId, targetIsWorkspace: !selectedFolderId })
  }

  function onOpenTabsClick() {
    // Multi-select: open exactly what's selected, never the whole workspace.
    if (selection.length > 1) {
      requestOpenMultiple(selection)
      return
    }
    if (selection.length === 1) {
      requestOpen(selection[0])
      return
    }
    if (activeWorkspaceId) requestOpen({ type: "workspace", id: activeWorkspaceId })
  }

  function openFullPage() {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL("tabs/fullpage.html") })
    }
  }

  function onImportFile(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => engine.importData(String(reader.result || ""))
    reader.readAsText(file)
    e.target.value = ""
  }

  function onResetClick() {
    if (window.confirm("Reset all TabExplorer workspaces, folders, and links? You can undo this from the saved undo history.")) {
      engine.resetData()
    }
  }

  const isWorkspaceCollapsed = activeWorkspace ? !!collapsedWorkspaces[activeWorkspace.id] : false
  const isWorkspaceRowSelected = activeWorkspace ? isSelected("workspace", activeWorkspace.id) : false

  function onPanelClick(e) {
    if (e.target === e.currentTarget) clearSelection()
  }

  return (
    // Clicking anywhere that isn't a selectable row (folder/link/workspace) clears selection.
    // Rows themselves stopPropagation() so this only fires on genuine "empty space" clicks.
    <div className="panel-root" onClick={onPanelClick}>
      <header className="header">
        <div className="brand">
          <img src={logo} alt="" className="brand-logo" />
          <span className="brand-title">TAB <b>Explorer</b></span>
        </div>
        <button className="expand-btn" title="Open in full view" onClick={openFullPage}>
          <Maximize2 size={14} />
        </button>
      </header>

      <Toolbar
        onSaveTabs={onSaveTabsClick}
        onOpenTabs={onOpenTabsClick}
        onNewWorkspace={() => setModal({ type: "newWorkspace" })}
        onUndo={undo}
        canUndo={historyCount > 0}
      />

      <SearchBar value={search} onChange={setSearch} />

      {/* Reserved purely for choosing the active workspace — no selection/collapse logic here. */}
      <WorkspaceSwitcher
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelect={(id) => setActiveWorkspaceId(id)}
        onContextMenu={openContextMenu}
      />

      {activeWorkspace ? (
        <>
          <div
            className={`ws-header${isWorkspaceRowSelected ? " ws-header-selected" : ""}`}
            onClick={(e) => {
              e.stopPropagation()
              clickSelect("workspace", activeWorkspace.id, e)
            }}
            onContextMenu={(e) => openContextMenu(e, { type: "workspace", id: activeWorkspace.id })}
          >
            <div className="ws-header-title">
              <button
                className="chevron-btn"
                title={isWorkspaceCollapsed ? "Expand" : "Collapse"}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleWorkspaceCollapsed(activeWorkspace.id)
                }}
              >
                <ChevronRight
                  size={13}
                  style={{ transform: isWorkspaceCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .12s ease" }}
                />
              </button>
              <span>{activeWorkspace.name} Workspace</span>
            </div>
            <div className="ws-header-actions">
              <button
                title="New link"
                onClick={(e) => {
                  e.stopPropagation()
                  setModal({ type: "newLink", parentId: selectedFolderId })
                }}
              >
                <Link2 size={15} />
              </button>
              <button
                title="New folder"
                onClick={(e) => {
                  e.stopPropagation()
                  setModal({ type: "newFolder", parentId: selectedFolderId })
                }}
              >
                <FolderPlus size={15} />
              </button>
            </div>
          </div>

          {!isWorkspaceCollapsed && <Tree engine={engine} />}
        </>
      ) : (
        <div className="empty-state">Create a workspace to get started.</div>
      )}

      <footer className="status-bar">
        <span>{activeWorkspace ? 1 : 0} Active workspace</span>
        <span className="backup-actions">
          <button onClick={engine.exportData} title="Export backup JSON">Export</button>
          <button onClick={() => importInputRef.current && importInputRef.current.click()} title="Import backup JSON">Import</button>
          <button onClick={onResetClick} title="Reset all data">Reset</button>
        </span>
        <input ref={importInputRef} className="file-input-hidden" type="file" accept="application/json,.json" onChange={onImportFile} />
      </footer>

      {toast && <div className="toast">{toast}</div>}

      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          selection={selection}
          clipboard={clipboard}
          onOpen={(target) => {
            if (selection.length > 1) requestOpenMultiple(selection)
            else requestOpen(target)
          }}
          onRename={(target) => {
            const item =
              target.type === "folder" ? folders.find((f) => f.id === target.id) :
              target.type === "link" ? links.find((l) => l.id === target.id) :
              workspaces.find((w) => w.id === target.id)
            if (item) startRename(target.type, target.id, target.type === "link" ? item.title : item.name)
          }}
          onDelete={(target) => {
            if (target.type === "workspace") deleteWorkspace(target.id)
            else deleteItems(selection.length ? selection : [target])
          }}
          onCut={() => copySelection("cut")}
          onCopy={() => copySelection("copy")}
          onPaste={(folderId) => pasteInto(folderId)}
          onNewFolder={(parentId) => setModal({ type: "newFolder", parentId })}
          onNewLink={(parentId) => setModal({ type: "newLink", parentId })}
          onEdit={(target) => setModal({ type: "edit", target })}
        />
      )}

      {modal && (
        <Modal
          modal={modal}
          workspaces={workspaces}
          folders={engine.wsFolders}
          links={links}
          onClose={() => setModal(null)}
          onCreateWorkspace={(name) => { createWorkspace(name); setModal(null) }}
          onCreateFolder={(name, parentId) => { createFolder(name, parentId); setModal(null) }}
          onCreateLink={(title, url, parentId) => { createLink(title, url, parentId); setModal(null) }}
          onUpdateWorkspace={(id, name) => { engine.updateWorkspaceName(id, name); setModal(null) }}
          onUpdateFolderColor={(id, color) => { engine.updateFolderColor(id, color); setModal(null) }}
          onUpdateFolder={(id, name, color, starred) => { engine.updateFolderDetails(id, name, color, starred); setModal(null) }}
          onUpdateLink={(id, title, url, icon) => { engine.updateLinkDetails(id, title, url, icon); setModal(null) }}
          onSaveTabs={(targetId, mode) => saveTabs(targetId, mode)}
          onSaveTabsToNewFolder={(name, mode) => saveTabsToNewFolder(name, mode)}
          onConfirmBatch={(target) => {
            const targetLinks = collectLinksForOpen(target)
            openTabsBatched(targetLinks.map((l) => l.url))
            setModal(null)
          }}
        />
      )}
    </div>
  )
}
