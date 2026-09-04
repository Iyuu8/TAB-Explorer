import React, { useRef, useState, useEffect } from "react"
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
  const { loaded } = engine   // pulled out early so hooks below can reference it
  const importInputRef = useRef(null)
  const [wsHeaderDragOver, setWsHeaderDragOver] = useState(false)
  
  const [restorableTabs, setRestorableTabs] = useState(null)

  function isRealTab(url) {
    if (!url) return false;
    if (url.startsWith("chrome://newtab")) return false;
    if (url.startsWith("edge://newtab")) return false;
    if (url.startsWith("about:blank")) return false;
    return true;
  }

  useEffect(() => {
    // Wait until the engine has fully loaded before checking session
    // Without this, setRestorableTabs fires while loaded=false (early return),
    // so the state update is lost when loaded flips to true and re-renders.
    if (!loaded) return;
    if (typeof chrome === "undefined" || !chrome.storage) return;
    let cancelled = false;

    (async () => {
      try {
        console.log("[TabExplorer:DEBUG] Step 1 — effect running, cancelled =", cancelled);

        const { lastKnownSession } = await chrome.storage.local.get("lastKnownSession");
        console.log("[TabExplorer:DEBUG] Step 2 — lastKnownSession =", lastKnownSession);

        if (!lastKnownSession || !lastKnownSession.length) {
          console.log("[TabExplorer:DEBUG] ABORT — no lastKnownSession in storage");
          return;
        }

        const normalize = (url) => {
          try {
            const u = new URL(url);
            return u.origin + u.pathname.replace(/\/$/, "") + u.search;
          } catch { return url; }
        };

        const savedRealUrls = new Set(
          lastKnownSession.filter(t => isRealTab(t.url)).map(t => normalize(t.url))
        );
        console.log("[TabExplorer:DEBUG] Step 3 — savedRealUrls =", [...savedRealUrls]);

        if (savedRealUrls.size === 0) {
          console.log("[TabExplorer:DEBUG] ABORT — no real tabs in saved session");
          return;
        }

        const currentTabs = await chrome.tabs.query({});
        const currentRealUrls = new Set(
          currentTabs.filter(t => isRealTab(t.url)).map(t => normalize(t.url))
        );
        console.log("[TabExplorer:DEBUG] Step 4 — currentRealUrls =", [...currentRealUrls]);

        let missingUrl = null;
        for (const url of savedRealUrls) {
          if (!currentRealUrls.has(url)) { missingUrl = url; break; }
        }
        console.log("[TabExplorer:DEBUG] Step 5 — first missing URL =", missingUrl, "| cancelled =", cancelled);

        if (missingUrl && !cancelled) {
          console.log("[TabExplorer:DEBUG] Step 6 — SHOWING BANNER ✅");
          setRestorableTabs(lastKnownSession);
        } else if (!missingUrl) {
          console.log("[TabExplorer:DEBUG] ABORT — all saved tabs are already open, no banner needed");
        } else if (cancelled) {
          console.log("[TabExplorer:DEBUG] ABORT — cancelled=true (React Strict Mode cleanup ran first)");
        }
      } catch (e) {
        console.error("[TabExplorer:DEBUG] ERROR in session check:", e);
      }
    })();

    return () => {
      console.log("[TabExplorer:DEBUG] cleanup — setting cancelled=true");
      cancelled = true;
    };
  }, [loaded]);  // re-runs when loaded flips to true; the !loaded guard above ensures it only does real work once

  function handleRestoreSession() {
    if (restorableTabs) {
      restorableTabs.forEach(tab => {
        if (isRealTab(tab.url)) {
          chrome.tabs.create({ url: tab.url, active: tab.active, pinned: tab.pinned });
        }
      });
    }
    // Clear lastKnownSession so the banner doesn't reappear after restore
    chrome.storage.local.remove("lastKnownSession");
    setRestorableTabs(null);
  }

  function handleDismissSession() {
    // Clear lastKnownSession so the banner doesn't reappear after dismissal
    chrome.storage.local.remove("lastKnownSession");
    setRestorableTabs(null);
  }

  const {
    workspaces, activeWorkspace, activeWorkspaceId,
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
    if (e.target.closest('button, input')) return
    clearSelection()
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

      {restorableTabs && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-box" style={{ textAlign: 'center' }}>
            <div className="modal-title" style={{ fontSize: '15px', marginBottom: '6px' }}>🔄 Restore Previous Session?</div>
            <p className="modal-text" style={{ marginBottom: '16px' }}>
              You had <strong>{restorableTabs.filter(t => isRealTab(t.url)).length} tab{restorableTabs.filter(t => isRealTab(t.url)).length !== 1 ? 's' : ''}</strong> open last time. Want to reopen them?
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleDismissSession}>Dismiss</button>
              <button type="button" className="btn-primary" onClick={handleRestoreSession}>Restore</button>
            </div>
          </div>
        </div>
      )}

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
            className={`ws-header${isWorkspaceRowSelected ? " ws-header-selected" : ""}${wsHeaderDragOver ? " ws-header-drop-target" : ""}`}
            data-dropkey={`workspace:${activeWorkspace.id}`}
            data-droptarget="__root__"
            onClick={(e) => {
              e.stopPropagation()
              clickSelect("workspace", activeWorkspace.id, e)
            }}
            onContextMenu={(e) => openContextMenu(e, { type: "workspace", id: activeWorkspace.id })}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setWsHeaderDragOver(true)
            }}
            onDragLeave={(e) => {
              e.stopPropagation()
              setWsHeaderDragOver(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setWsHeaderDragOver(false)
              const raw = e.dataTransfer.getData("text/plain")
              if (!raw) return
              try {
                const items = JSON.parse(raw)
                engine.moveItems(items, null)
              } catch {
                // ignore malformed payloads
              }
            }}
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
