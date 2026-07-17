import React from "react"

export default function WorkspaceSwitcher({ workspaces, activeWorkspaceId, onSelect, onContextMenu }) {
  return (
    <>
      <div className="section-label">Workspaces</div>
      <div className="ws-row">
        {workspaces.map((w) => (
          <button
            key={w.id}
            className={`ws-pill${w.id === activeWorkspaceId ? " ws-pill-active" : ""}`}
            onClick={() => onSelect(w.id)}
            onContextMenu={(e) => onContextMenu(e, { type: "workspace", id: w.id })}
          >
            <span className="ws-dot" style={{ background: w.color || "#2f6690" }} />
            {w.name}
          </button>
        ))}
      </div>
    </>
  )
}
