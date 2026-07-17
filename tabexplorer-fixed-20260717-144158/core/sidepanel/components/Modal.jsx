import React, { useMemo, useState } from "react"
import { BATCH_SIZE, FOLDER_PALETTE, LINK_ICON_OPTIONS, inferLinkIcon } from "../lib/utils"

export default function Modal({
  modal, workspaces, folders, links, onClose,
  onCreateWorkspace, onCreateFolder, onCreateLink,
  onUpdateWorkspace, onUpdateFolderColor, onUpdateLink,
  onSaveTabs, onConfirmBatch
}) {
  const target = modal.target
  const editItem = useMemo(() => {
    if (!target) return null
    if (target.type === "folder") return folders.find((f) => f.id === target.id)
    if (target.type === "link") return links.find((l) => l.id === target.id)
    return workspaces.find((w) => w.id === target.id)
  }, [target, folders, links, workspaces])

  const [text, setText] = useState(editItem ? (target.type === "link" ? editItem.title : editItem.name) : "")
  const [url, setUrl] = useState(editItem && target.type === "link" ? editItem.url : "")
  const [folderColor, setFolderColor] = useState(editItem && target.type === "folder" ? (editItem.color || FOLDER_PALETTE[0]) : FOLDER_PALETTE[0])
  const [linkIcon, setLinkIcon] = useState(editItem && target.type === "link" ? (editItem.icon || "") : "")
  const [customIcon, setCustomIcon] = useState("")
  const [saveTargetId, setSaveTargetId] = useState(modal.targetId || null)
  const [saveMode, setSaveMode] = useState("append")

  function closeFromOverlay(e) {
    e.stopPropagation()
    onClose()
  }

  function submit(e) {
    e.preventDefault()
    if (modal.type === "newWorkspace") onCreateWorkspace(text)
    else if (modal.type === "newFolder") onCreateFolder(text, modal.parentId)
    else if (modal.type === "newLink") onCreateLink(text, url, modal.parentId)
    else if (modal.type === "saveTabs") onSaveTabs(saveTargetId, saveMode)
    else if (modal.type === "batchWarning") onConfirmBatch(modal.target)
    else if (modal.type === "edit" && editItem) {
      if (target.type === "workspace") onUpdateWorkspace(target.id, text)
      else if (target.type === "folder") onUpdateFolderColor(target.id, folderColor)
      else onUpdateLink(target.id, text, url, customIcon.trim() || linkIcon || inferLinkIcon(url, text))
    }
  }

  let title = ""
  let body = null
  let primary = "Save"
  let disabled = false

  if (modal.type === "newWorkspace") {
    title = "New Workspace"
    primary = "Create"
    disabled = !text.trim()
    body = <input autoFocus className="modal-input" placeholder="Workspace name" value={text} onChange={(e) => setText(e.target.value)} />
  } else if (modal.type === "newFolder") {
    title = "New Folder"
    primary = "Create"
    disabled = !text.trim()
    body = <input autoFocus className="modal-input" placeholder="Folder name" value={text} onChange={(e) => setText(e.target.value)} />
  } else if (modal.type === "newLink") {
    title = "New Link"
    primary = "Create"
    disabled = !url.trim()
    body = (
      <>
        <input autoFocus className="modal-input" placeholder="Name" value={text} onChange={(e) => setText(e.target.value)} />
        <input className="modal-input" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
      </>
    )
  } else if (modal.type === "saveTabs") {
    title = "Save Current Tabs"
    body = (
      <>
        <div className="modal-label">Target folder</div>
        <select className="modal-input" value={saveTargetId || ""} onChange={(e) => setSaveTargetId(e.target.value || null)}>
          <option value="">Workspace root</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <div className="modal-label">Mode</div>
        <div className="segmented">
          <button type="button" className={saveMode === "append" ? "seg-active" : ""} onClick={() => setSaveMode("append")}>Append</button>
          <button type="button" className={saveMode === "replace" ? "seg-active" : ""} onClick={() => setSaveMode("replace")}>Replace</button>
        </div>
      </>
    )
  } else if (modal.type === "batchWarning") {
    title = "Open Many Tabs?"
    primary = "Open Anyway"
    body = <p className="modal-text">This will open {modal.count} tabs in batches of {BATCH_SIZE} to avoid freezing Chrome.</p>
  } else if (modal.type === "edit") {
    title = "Edit"
    if (!editItem) {
      body = <p className="modal-text">This item no longer exists.</p>
      disabled = true
    } else if (target.type === "workspace") {
      body = <input autoFocus className="modal-input" placeholder="Workspace name" value={text} onChange={(e) => setText(e.target.value)} />
      disabled = !text.trim()
    } else if (target.type === "folder") {
      body = (
        <>
          <div className="modal-label">{editItem.name}</div>
          <div className="color-grid">
            {FOLDER_PALETTE.map((color) => (
              <button
                type="button"
                key={color}
                className={`color-swatch${folderColor === color ? " color-swatch-active" : ""}`}
                style={{ background: color }}
                onClick={() => setFolderColor(color)}
                title={color}
              />
            ))}
          </div>
          <input className="modal-input" value={folderColor} onChange={(e) => setFolderColor(e.target.value)} />
        </>
      )
    } else {
      const autoIcon = inferLinkIcon(url, text)
      body = (
        <>
          <input autoFocus className="modal-input" placeholder="Name" value={text} onChange={(e) => setText(e.target.value)} />
          <input className="modal-input" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="modal-label">Icon</div>
          <select className="modal-input" value={linkIcon} onChange={(e) => setLinkIcon(e.target.value)}>
            {LINK_ICON_OPTIONS.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
          </select>
          <input className="modal-input" placeholder="Custom icon URL" value={customIcon} onChange={(e) => setCustomIcon(e.target.value)} />
          {(customIcon || linkIcon || autoIcon) && <img className="icon-preview" src={customIcon || linkIcon || autoIcon} alt="" />}
        </>
      )
      disabled = !url.trim()
    }
  }

  return (
    <div className="modal-overlay" onClick={closeFromOverlay}>
      <form className="modal-box" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {body}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={disabled}>{primary}</button>
        </div>
      </form>
    </div>
  )
}
