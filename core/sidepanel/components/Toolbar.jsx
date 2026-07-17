import React from "react"
import { Save, FolderOpen, Layers, Undo2 } from "lucide-react"

export default function Toolbar({ onSaveTabs, onOpenTabs, onNewWorkspace, onUndo, canUndo }) {
  return (
    <div className="toolbar">
      <button className="tool-btn tool-primary" onClick={onSaveTabs} title="Save tabs (Ctrl+Shift+S)">
        <Save size={15} className="tool-icon" />
        <span>save tabs</span>
      </button>
      <button className="tool-btn" onClick={onOpenTabs} title="Open selected tabs">
        <FolderOpen size={15} className="tool-icon" />
        <span>open tabs</span>
      </button>
      <button className="tool-btn" onClick={onNewWorkspace} title="Create new workspace">
        <Layers size={15} className="tool-icon" />
        <span>new workspace</span>
      </button>
      <button className="tool-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2 size={15} className="tool-icon" />
        <span>undo</span>
      </button>
    </div>
  )
}
