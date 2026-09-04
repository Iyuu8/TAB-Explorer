import React, { useRef, useEffect } from "react"

export default function WorkspaceSwitcher({ workspaces, activeWorkspaceId, onSelect, onContextMenu }) {
  const rowRef = useRef(null)

  useEffect(() => {
    const el = rowRef.current
    if (!el) return

    const handleWheel = (e) => {
      // If there's a vertical scroll (deltaY), translate it to horizontal
      if (e.deltaY !== 0) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [])

  return (
    <>
      <div className="section-label">Workspaces</div>
      <div className="ws-row" ref={rowRef}>
        {workspaces.map((w) => (
          <button
            key={w.id}
            className={`ws-pill${w.id === activeWorkspaceId ? " ws-pill-active" : ""}`}
            data-dropkey={`workspace:${w.id}`}
            data-droptarget={`__workspace__${w.id}`}
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
