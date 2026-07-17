import React from "react"
import { Search } from "lucide-react"

export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-wrap">
      <button type="button" className="search-button" tabIndex={-1}>
        <Search size={18} className="search-icon" />
      </button>
      <input
        className="search-input"
        placeholder="search for folders and links across workspaces"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
