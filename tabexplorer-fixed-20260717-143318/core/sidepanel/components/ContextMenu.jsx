import React from "react"

export default function ContextMenu({
  menu, onClose, selection, clipboard,
  onOpen, onRename, onDelete, onCut, onCopy, onPaste, onNewFolder, onNewLink, onEdit
}) {
  const { x, y, target } = menu
  const isFolder = target && target.type === "folder"
  const isLink = target && target.type === "link"
  const isWorkspace = target && target.type === "workspace"
  const multi = selection.length > 1

  function item(label, onClick, disabled) {
    return (
      <div
        className={`ctx-item${disabled ? " ctx-disabled" : ""}`}
        onClick={(e) => {
          e.stopPropagation()
          if (disabled) return
          onClick()
          onClose()
        }}
      >
        {label}
      </div>
    )
  }

  return (
    <div className="ctx-menu" style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()}>
      {(isFolder || isWorkspace) && item("Open", () => onOpen(target))}
      {!multi && (isFolder || isLink || isWorkspace) && item("Rename", () => onRename(target))}
      {item("Cut", onCut, !target)}
      {item("Copy", onCopy, !target)}
      {item("Paste", () => onPaste(isFolder ? target.id : null), !clipboard)}
      {(isFolder || isWorkspace) && item("New Folder", () => onNewFolder(isFolder ? target.id : null))}
      {(isFolder || isWorkspace) && item("New Link", () => onNewLink(isFolder ? target.id : null))}
      {target && item("Delete", () => onDelete(target))}
      {target && item("Edit", () => onEdit(target))}
    </div>
  )
}
