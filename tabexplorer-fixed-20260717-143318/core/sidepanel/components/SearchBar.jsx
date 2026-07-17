import React from "react"
import { Search } from "lucide-react"

export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-wrap">
      <Search size={13} className="search-icon" />
      <input
        className="search-input"
        placeholder="search for folders and links across workspaces"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
