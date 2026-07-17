import React, { useLayoutEffect, useRef, useState } from "react"

export default function ContextMenu({
  menu, onClose, selection, clipboard,
  onOpen, onRename, onDelete, onCut, onCopy, onPaste, onNewFolder, onNewLink, onEdit
}) {
  const { x, y, target } = menu
  const menuRef = useRef(null)
  const [position, setPosition] = useState({ top: y, left: x })
  const isFolder = target && target.type === "folder"
  const isLink = target && target.type === "link"
  const isWorkspace = target && target.type === "workspace"
  const multi = selection.length > 1

  useLayoutEffect(() => {
    const node = menuRef.current
    if (!node) return
    const pad = 8
    const rect = node.getBoundingClientRect()
    const maxLeft = window.innerWidth - rect.width - pad
    const maxTop = window.innerHeight - rect.height - pad
    setPosition({
      left: Math.max(pad, Math.min(x, maxLeft)),
      top: Math.max(pad, Math.min(y, maxTop))
    })
  }, [x, y])

  function item(label, onClick, disabled, shortcut = "") {
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
        <span>{label}</span>
        {shortcut && <span className="ctx-shortcut">{shortcut}</span>}
      </div>
    )
  }

  return (
    <div ref={menuRef} className="ctx-menu" style={position} onClick={(e) => e.stopPropagation()}>
      {(isFolder || isWorkspace) && item("Open", () => onOpen(target), false, "Enter")}
      {!multi && (isFolder || isLink || isWorkspace) && item("Rename", () => onRename(target), false, "F2")}
      {item("Cut", onCut, !target, "Ctrl+X")}
      {item("Copy", onCopy, !target, "Ctrl+C")}
      {item("Paste", () => onPaste(isFolder ? target.id : null), !clipboard, "Ctrl+V")}
      {(isFolder || isWorkspace) && item("New Folder", () => onNewFolder(isFolder ? target.id : null))}
      {(isFolder || isWorkspace) && item("New Link", () => onNewLink(isFolder ? target.id : null))}
      {target && item("Delete", () => onDelete(target), false, "Del")}
      {target && item("Edit", () => onEdit(target))}
    </div>
  )
}
