# TabExplorer

TabExplorer is a Chrome extension that turns your browser tabs into a structured, file-explorer-style workspace. Instead of a flat pile of bookmarks, you organize saved tabs into **Workspaces → Folders → Links**, exactly like organizing files on your computer — then reopen any group of tabs with a single click.

Built with [Plasmo](https://www.plasmo.com/), it lives in Chrome's side panel so it stays open and accessible while you browse.

---

## Table of Contents

- [Why TabExplorer](#why-tabexplorer)
- [Features](#features)
- [Installation](#installation)
  - [Option A — Load from a pre-built zip](#option-a--load-from-a-pre-built-zip)
  - [Option B — Build from source](#option-b--build-from-source)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
  - [Workspaces](#workspaces)
  - [Folders & Links](#folders--links)
  - [Saving Current Tabs](#saving-current-tabs)
  - [Opening Tabs](#opening-tabs)
  - [Selecting Items](#selecting-items)
  - [Context Menu](#context-menu)
  - [Editing Items](#editing-items)
  - [Starred Folders](#starred-folders)
  - [Search](#search)
  - [Cut, Copy & Paste](#cut-copy--paste)
  - [Undo](#undo)
  - [Backup: Export, Import & Reset](#backup-export-import--reset)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Data & Storage](#data--storage)
- [Permissions](#permissions)
- [Project Structure](#project-structure)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Why TabExplorer

Most tab managers think in terms of **sessions** — a snapshot of what was open. TabExplorer instead treats every saved tab as a **first-class file**: it has a title, a URL, and a place inside a folder. The mental model shifts from *"restore my browsing session"* to *"open my project's folder."*

If you've ever used Windows Explorer or the VS Code file tree, you already know how to use TabExplorer.

## Features

- 🗂️ **Workspaces, folders, and nested folders** for organizing tabs by project, course, or context
- 💾 **Save current tabs** into any folder in one click (Append or Replace mode)
- 🚀 **Reopen tabs** — a single link, a whole folder, several selected items, or an entire workspace — opened safely in batches so Chrome doesn't freeze
- 🔍 **Cross-workspace search** — instantly find any folder or link regardless of which workspace it lives in
- 🖱️ **File-explorer interactions** — multi-select (Ctrl/Cmd-click, Shift-click), right-click context menu, drag-free cut/copy/paste, inline rename
- ✏️ **Edit modal** — rename items, recolor folders, and override link icons
- ⭐ **Starred folders** for pinning your most-used folders to the top
- 🎨 **Known-site icons** — recognizable icons for ChatGPT, Claude, Gemini, DeepSeek, Kimi, YouTube, Google Drive/Gmail/other Google apps, Facebook, Instagram, LinkedIn, GitHub, Notion, X/Twitter, Reddit, WhatsApp, Slack, Figma, and more, with automatic fallback to the real favicon or a letter badge
- ↩️ **Undo** for every mutating action (up to 50 steps), persisted across restarts
- 📦 **Export / Import / Reset** — back up your data to JSON and restore it any time
- ⌨️ **Keyboard shortcuts** for everything, so you rarely need the mouse
- 🔒 **100% local** — no account, no cloud, no external server; everything lives in `chrome.storage.local` on your machine

## Installation

TabExplorer is not yet published on the Chrome Web Store, so it's installed as an **unpacked extension** in Developer Mode.

### Option A — Load from a pre-built zip

1. Download the latest release zip (or the `build/chrome-mv3-prod` folder if you built it yourself).
2. Unzip it somewhere permanent — don't delete or move the folder afterward, Chrome loads the extension directly from it.
3. Open Chrome and go to `chrome://extensions`.
4. Turn on **Developer mode** (top-right toggle).
5. Click **Load unpacked**.
6. Select the unzipped folder (the one containing `manifest.json`).
7. TabExplorer's icon should now appear in your Chrome toolbar. Pin it for quick access.

### Option B — Build from source

Requires [Node.js](https://nodejs.org/) (v18+) and a package manager (`pnpm`, `npm`, or `yarn`).

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/tabexplorer.git
cd tabexplorer

# 2. Install dependencies
pnpm install
# or: npm install / yarn install

# 3. Build a production bundle
pnpm build
# or: npm run build / yarn build
```

This produces a `build/chrome-mv3-prod` folder. Load it as an unpacked extension using steps 3–7 from Option A above.

> For active development with hot-reload, use `pnpm dev` instead and load the generated `build/chrome-mv3-dev` folder.

## Getting Started

1. Click the TabExplorer icon in the Chrome toolbar — the side panel opens and stays docked as you browse.
2. A default workspace named **Personal** is created automatically.
3. Click **Save Tabs** in the toolbar to save your currently open tabs into that workspace.
4. Create folders to organize things further, and use **New Workspace** to separate unrelated contexts (e.g. "University," "Client Project," "Personal").

## Usage Guide

### Workspaces

Workspaces are the top-level containers — think of them as separate "projects" or "contexts," each with its own folder tree.

- The **workspace switcher** at the top shows all your workspaces as a horizontal carousel. Click one to make it active.
- The **active workspace row** below the switcher shows the current workspace's name, a collapse/expand arrow, and buttons to create a new link or folder directly inside it.
- The active workspace row itself can be selected (left-click it) so that new items are created at its root.
- Click the arrow to collapse or expand the current workspace's tree.

### Folders & Links

- Folders can be nested arbitrarily deep.
- Links represent saved tabs — each has a title, URL, and icon.
- Folder rows display a badge with the number of direct children.
- Click the chevron next to a folder to expand/collapse it.
- Names that are too long are truncated with `…` — hover or open the Edit modal to see the full value.

### Saving Current Tabs

Click **Save Tabs** in the toolbar (or press `Ctrl/Cmd+Shift+S`) to open the save modal:

1. Choose a destination: the **workspace root**, an **existing folder**, or **Create new folder…** (type a name on the spot).
2. Choose a mode:
   - **Append** — adds the current tabs to the target, skipping any URLs already saved there.
   - **Replace** — clears the target folder first, then saves the current tabs.

`chrome://` internal pages are automatically ignored.

### Opening Tabs

Click **Open Tabs** in the toolbar, or use the context menu's **Open**:

- With nothing selected → opens the entire active workspace.
- With one item selected → opens that link, or every link inside that folder.
- With multiple items selected → opens exactly the selected items (and their contents, for folders) — never more.

To protect Chrome from freezing, more than **20 tabs** at once triggers a warning modal; confirming opens them in batches of 20, spaced 300ms apart.

### Selecting Items

TabExplorer supports familiar file-explorer selection:

| Action | Result |
|---|---|
| Left-click | Select a single item |
| `Ctrl`/`Cmd` + click | Add or remove an item from the selection |
| `Shift` + click | Select a range of visible items |
| Click empty space | Clear the selection |

Selection works across workspaces, folders, and links, and selected rows are highlighted.

### Context Menu

Right-click any workspace, folder, or link to open a custom context menu with:

- **Open** — open the item's tabs
- **Rename** (`F2`)
- **Edit** — full edit modal (see below)
- **Cut** (`Ctrl/Cmd+X`) / **Copy** (`Ctrl/Cmd+C`) / **Paste** (`Ctrl/Cmd+V`)
- **New Folder** / **New Link** — created inside the right-clicked folder/workspace
- **Delete** (`Del`/`Backspace`)

The menu automatically repositions itself so it's never cut off near the edge of the panel, and clicking anywhere outside it closes it.

### Editing Items

The **Edit** option opens a modal tailored to the item type:

- **Folders** — rename, toggle starred, and change the folder's color (which recolors its icon).
- **Links** — rename, edit the URL, and set the icon: pick from known-site presets, paste a custom icon URL, or leave it on auto-detect.

Press `Enter` to save, `Escape` or click outside the modal to cancel.

### Starred Folders

Click a folder's star icon to pin it. Starred folders:

- Show a filled star
- Sort above their unstarred siblings **at the same level only** — a starred nested folder stays inside its parent rather than jumping to the top of the whole tree

### Search

The search bar at the top searches **across all workspaces at once**, not just the active one. It matches folder names, link titles, and link URLs. While searching, results are shown as a flat list with a path hint (workspace / folder) so you can tell exactly where each match lives.

### Cut, Copy & Paste

- **Cut** moves the original item(s) on paste.
- **Copy** duplicates the item(s) on paste — copying a folder duplicates its entire nested structure.
- Paste targets a folder (or the workspace root if nothing/no folder is selected).
- TabExplorer prevents invalid moves, such as pasting a folder inside itself.

### Undo

Every mutating action — create, rename, edit, delete, cut/paste, save tabs, import, reset — can be undone with `Ctrl/Cmd+Z` or the toolbar's **Undo** button. Up to 50 steps are kept, and undo history survives closing and reopening the panel.

### Backup: Export, Import & Reset

Found in the footer:

- **Export** — downloads a JSON backup (`tabexplorer-backup-YYYY-MM-DD.json`) containing all your workspaces, folders, and links.
- **Import** — choose a previously exported JSON file to restore it. Data is validated and normalized before being applied.
- **Reset** — wipes current data and restores a fresh default workspace. This is undoable, so a reset isn't permanent unless you want it to be.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + A` | Select all visible items |
| `Ctrl/Cmd + C` | Copy selected items |
| `Ctrl/Cmd + X` | Cut selected items |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + S` | Save current tabs |
| `Escape` | Clear selection / close menu or modal |
| `Delete` / `Backspace` | Delete selected items |
| `F2` | Rename selected folder or link |
| `Enter` | Confirm the open modal |

Shortcuts are automatically ignored while typing inside a text field.

## Data & Storage

TabExplorer stores everything **locally** in `chrome.storage.local` — there is no account system, no cloud sync, and no external server involved.

- **Main data** (`tabExplorerData`) — workspaces, folders, links, active workspace, and expanded-folder UI state, saved to storage with a short debounce so rapid actions don't trigger excessive writes.
- **Undo history** (`tabExplorerHistory`) — kept separately so it can survive closing and reopening the panel.
- **Versioned & normalized** — stored data carries a version number, and older/incomplete records are safely filled in with default values (color, starred state, icon, etc.) when loaded, so upgrades never lose data.

Your data never leaves your machine unless you explicitly use **Export**.

## Permissions

| Permission | Why it's needed |
|---|---|
| `tabs` | Read currently open tabs (to save them) and open new ones (to restore them) |
| `storage` | Persist workspaces/folders/links in `chrome.storage.local` |
| `sidePanel` | Render TabExplorer's UI as a Chrome side panel |
| `https://*/*` (host permission) | Fetch favicons/known-site icons for saved links |

TabExplorer does not read page content, track browsing history, or transmit data anywhere.

## Project Structure

```
tabexplorer/
├── background.js                     # Opens the side panel on toolbar-icon click
├── sidepanel.jsx                     # Side panel entry point / top-level layout
└── core/
    └── sidepanel/
        ├── sidepanel.css             # All side panel styling
        ├── components/
        │   ├── Toolbar.jsx
        │   ├── SearchBar.jsx
        │   ├── WorkspaceSwitcher.jsx
        │   ├── Tree.jsx               # Folder/link tree rendering
        │   ├── ContextMenu.jsx
        │   └── Modal.jsx              # New/Edit/Save/Batch-warning modals
        ├── hooks/
        │   └── useTabExplorer.js     # Core state, CRUD, selection, undo, tabs logic
        └── lib/
            ├── storage.js            # chrome.storage.local read/write, versioning
            ├── utils.js               # Constants + known-site icon inference
            └── icons.js               # Icon detection helpers
```

## Known Limitations

- **No drag-and-drop** — items are organized via Cut/Copy/Paste, the context menu, and keyboard shortcuts.
- **No cross-device sync** — data lives in `chrome.storage.local` on the current machine. Use Export/Import to move data between devices.
- **Chrome (Manifest V3) only** — no Firefox/Edge-specific build at this time.
- **Full tab suspension / window-layout restore** is out of scope; TabExplorer restores URLs, not pinned/grouped window state.

## License

<!-- Replace with your chosen license, e.g.: -->
This project is licensed under the [MIT License](LICENSE).