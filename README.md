# TAB Explorer

TAB Explorer is a Chrome extension that turns your browser tabs into a structured, file-explorer-style workspace. Instead of a flat pile of bookmarks, you organize saved tabs into **Workspaces**, **Folders**, and **Links** — the same mental model as a file tree — then reopen any group with a single click.

Built with [Plasmo](https://www.plasmo.com/) and React. Lives in Chrome's **side panel** so it stays docked and accessible while you browse.

---

## Table of Contents

- [Why TAB Explorer](#why-tab-explorer)
- [Features](#features)
- [Installation](#installation)
  - [Option A — Load from a pre-built folder](#option-a--load-from-a-pre-built-folder)
  - [Option B — Build from source](#option-b--build-from-source)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
  - [Workspaces](#workspaces)
  - [Folders & Links](#folders--links)
  - [Saving Current Tabs](#saving-current-tabs)
  - [Opening Tabs](#opening-tabs)
  - [Session Restore](#session-restore)
  - [Selecting Items](#selecting-items)
  - [Drag and Drop](#drag-and-drop)
  - [Context Menu](#context-menu)
  - [Editing Items](#editing-items)
  - [Starred Folders](#starred-folders)
  - [Search](#search)
  - [Cut, Copy & Paste](#cut-copy--paste)
  - [Undo](#undo)
  - [Full-Page View](#full-page-view)
  - [Backup: Export, Import & Reset](#backup-export-import--reset)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Data & Storage](#data--storage)
- [Permissions](#permissions)
- [Project Structure](#project-structure)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Why TAB Explorer

Most tab managers think in terms of sessions — a temporary snapshot of what was open. TAB Explorer treats every saved tab as a first-class persistent item: it has a title, a URL, a custom icon, and a place inside a folder. The mental model shifts from *"restore my session"* to *"open my project's folder."*

If you've used Windows Explorer or the VS Code file tree, you already know how to use TAB Explorer.

---

## Features

- **Workspaces, folders, and nested folders** for organizing tabs by project, course, or context
- **Save current tabs** into any folder in one click — Append or Replace mode
- **Reopen tabs** — a single link, a whole folder, a multi-selection, or an entire workspace — opened safely in batches so Chrome doesn't freeze
- **Session restore** — automatically tracks your open tabs in the background; if you reopen the browser with a different set of tabs than you had before, a modal offers to restore the previous session
- **Cross-workspace search** that finds any folder or link regardless of which workspace it lives in
- **File-explorer interactions**: multi-select (Ctrl/Cmd-click, Shift-click), drag and drop, right-click context menu, cut/copy/paste, inline rename
- **Edit modal** for renaming items, recoloring folders, starring folders, and overriding link icons
- **Starred folders** for pinning your most-used folders to the top of their level
- **Scrollable workspace bar** — mouse-wheel and scrollbar support so desktop users can navigate many workspaces without needing a touchpad
- **Smart icons** — auto-detects icons for popular sites (ChatGPT, Claude, Gemini, DeepSeek, Kimi, YouTube, Google Drive/Docs/Sheets/Slides/Gmail/Calendar/Meet, Facebook, Instagram, LinkedIn, GitHub, Notion, X/Twitter, Reddit, WhatsApp, Slack, Figma, and more) with automatic fallback to Chrome's favicon API or a domain-letter badge
- **Undo** for every mutating action (up to 50 steps), persisted across restarts
- **Export / Import / Reset** to back up your data to JSON and restore it any time
- **Keyboard shortcuts** for everything, so you rarely need the mouse
- **Fully local** — no account, no cloud, no external server; everything lives in `chrome.storage.local` on your machine

---

## Installation

TAB Explorer is not yet published on the Chrome Web Store, so it's installed as an **unpacked extension** in Developer Mode.

### Option A — Load from a pre-built folder

1. Download or build the extension (see Option B) to get a folder containing `manifest.json`.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select the folder containing `manifest.json`.
6. TAB Explorer's icon will appear in your Chrome toolbar. Pin it for quick access.
7. Click the icon — the side panel opens automatically.

### Option B — Build from source

Requires [Node.js](https://nodejs.org/) (v18+) and `npm` or `yarn`.

```bash
# 1. Clone the repository
git clone https://github.com/Iyuu8/TAB-Explorer.git
cd TAB-Explorer

# 2. Install dependencies
npm install
# or: yarn install

# 3a. Development build with hot-reload
npm run dev
# then load the generated build/chrome-mv3-dev folder as an unpacked extension

# 3b. Production build
npm run build
# then load build/chrome-mv3-prod as an unpacked extension
```

---

## Getting Started

1. Click the TAB Explorer icon in the Chrome toolbar — the side panel opens and stays docked as you browse.
2. A default **Personal** workspace is created automatically.
3. Click **Save Tabs** in the toolbar to capture your currently open tabs into that workspace.
4. Create folders to organize tabs further.
5. Use **New Workspace** to separate unrelated contexts (e.g. university, a client project, personal browsing).

---

## Usage Guide

### Workspaces

Workspaces are the top-level containers — think of them as separate projects or contexts, each with its own independent folder tree.

- The **workspace switcher** below the search bar shows all your workspaces as a horizontally scrollable row of pills. Click a pill to switch to that workspace.
  - On a desktop mouse, you can **scroll the mouse wheel** over the row to move left and right, or drag the thin scrollbar that appears beneath it.
- The **workspace header row** below the switcher shows the active workspace's name, plus **New Link** and **New Folder** buttons.
- Click the **chevron** on the workspace header to collapse or expand the current workspace's entire folder tree.
- Left-click the workspace header row to **select** it (so new items are created at the workspace root).
- Right-click the workspace header or a pill to open the context menu (rename, edit, delete, etc.).

### Folders & Links

- Folders can be nested **arbitrarily deep**. Nested content is connected to its parent by a thin vertical guide line, exactly like a code editor's file tree.
- **Links** represent saved tabs — each has a title, URL, and an icon (auto-detected or custom).
- Folder rows display a **badge** with the number of direct children.
- Click the **chevron** next to a folder to expand or collapse it.
- Long names are truncated with an ellipsis — hover over or open the Edit modal to see the full value.

### Saving Current Tabs

Click **Save Tabs** in the toolbar (or press `Ctrl/Cmd+Shift+S`) to open the save modal:

1. **Target**: choose the workspace root, an existing folder, or **"Create new folder…"** (type a name inline).
2. **Mode**:
   - **Append** — adds the current tabs to the target, automatically skipping any URLs that are already saved there.
   - **Replace** — clears all existing links in the target first, then saves the current tabs.

`chrome://` and other internal browser pages are automatically ignored.

### Opening Tabs

Click **Open Tabs** in the toolbar, or use the **Open** action in the context menu:

- **Nothing selected** → opens all links in the active workspace.
- **One item selected** → opens that link, or all links recursively inside that folder.
- **Multiple items selected** → opens exactly the selected items (and their contents for folders), never more.

Opening more than **20 tabs at once** triggers a confirmation modal. Confirming opens them in batches of 20, spaced 300 ms apart, to avoid freezing Chrome.

### Session Restore

TAB Explorer's background service worker continuously tracks your open tabs. Whenever a tab is created, updated, or closed (but the window is *not* closing), it snapshots the current session to `chrome.storage.local`.

When you open the side panel, TAB Explorer checks whether any tabs from the last saved session are missing from your current browser window:

- If **all saved tabs are already open**, no action is taken.
- If **one or more saved tabs are missing**, a modal appears asking:

  > 🔄 **Restore Previous Session?**  
  > You had **N tabs** open last time. Want to reopen them?

  Click **Restore** to reopen all the saved real tabs in new Chrome tabs. Click **Dismiss** to ignore the session and clear it. Either action removes the prompt until the next session change.

### Selecting Items

TAB Explorer supports familiar file-explorer multi-selection:

| Action | Result |
|---|---|
| Left-click | Select a single item |
| `Ctrl`/`Cmd` + click | Add or remove an item from the selection |
| `Shift` + click | Select a contiguous range of visible items |
| Click empty space | Clear the selection |

Selection works across folders, links, and the workspace header row.

### Drag and Drop

Folders and links can be dragged directly onto any folder row or the workspace header row to move them there.

- Dragging any item that is part of the current multi-selection moves **the whole selection**, not just the dragged item.
- A small **"N items"** indicator appears instead of a single-row preview during a multi-item drag.
- Dragging near the **top or bottom edge** of the list auto-scrolls the tree, compensating for the browser's suppression of scroll-wheel input during a drag.
- A folder **cannot** be dropped into itself or into any of its own descendants.
- Drag and drop is only available within the active workspace's tree — not on cross-workspace search results, to prevent accidentally moving a link to a different workspace.

### Context Menu

Right-click any workspace pill, workspace header, folder, or link to open the context menu:

| Action | Shortcut |
|---|---|
| Open | — |
| Rename | `F2` |
| Edit (full modal) | — |
| Cut | `Ctrl/Cmd+X` |
| Copy | `Ctrl/Cmd+C` |
| Paste | `Ctrl/Cmd+V` |
| New Folder | — |
| New Link | — |
| Delete | `Del` / `Backspace` |

The menu repositions itself automatically so it's never cut off near the panel edges. Clicking anywhere outside it closes it.

### Editing Items

The **Edit** action opens a modal tailored to the item type:

- **Workspace** — rename.
- **Folder** — rename, toggle **starred**, and change the folder's **color** (pick from a palette or type a hex value; the icon recolors accordingly).
- **Link** — rename, edit the URL, and set the icon: choose from known-site presets, paste a custom icon URL, or leave it on **Auto** to let the extension detect it.

Press `Enter` to save; press `Escape` or click the overlay to cancel.

### Starred Folders

Toggle a folder's star by using the Edit modal. Starred folders:

- Show a filled gold star icon.
- Sort **above** their unstarred siblings at the same nesting level — a starred nested folder stays inside its parent rather than jumping to the top of the whole tree.

### Search

The search bar at the top searches **all workspaces at once**, not just the active one. It matches folder names, link titles, and link URLs. While searching, results are displayed as a flat list with a **workspace / folder path hint** beneath each item so you know exactly where it lives.

While a search is active, drag-and-drop is disabled on the results to prevent accidentally moving items across workspaces.

### Cut, Copy & Paste

- **Cut** (`Ctrl/Cmd+X`) — marks the selection; the original items move to the paste target on paste.
- **Copy** (`Ctrl/Cmd+C`) — marks the selection; paste creates full deep duplicates (copying a folder duplicates its entire nested structure including all descendants).
- **Paste** (`Ctrl/Cmd+V`) — pastes into the selected folder, or the workspace root if nothing / no folder is selected.

Invalid moves (e.g. pasting a folder into itself or one of its descendants) are silently skipped.

### Undo

Every mutating action — create, rename, edit, delete, cut/paste, drag and drop, save tabs, import, reset — is undoable with `Ctrl/Cmd+Z` or the **Undo** button in the toolbar. Up to **50 steps** are kept in memory and persisted to `chrome.storage.local`, so undo history survives closing and reopening the panel.

### Full-Page View

Click the **⤢** (expand) button in the panel header to open TAB Explorer as a full browser tab for a more spacious view.

### Backup: Export, Import & Reset

Found in the **footer status bar**:

- **Export** — downloads a JSON backup file (`tabexplorer-backup-YYYY-MM-DD.json`) containing all workspaces, folders, and links.
- **Import** — choose a previously exported JSON file to restore it. Data is validated and normalized (missing fields filled with defaults) before being applied.
- **Reset** — wipes all current data and restores a fresh default workspace. This action is **undoable**, so a reset isn't permanent unless you explicitly clear the undo history.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + A` | Select all visible items |
| `Ctrl/Cmd + C` | Copy selected items |
| `Ctrl/Cmd + X` | Cut selected items |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + S` | Open Save Tabs modal |
| `F2` | Rename the selected item (inline) |
| `Delete` / `Backspace` | Delete selected items |
| `Escape` | Clear selection / close menu or modal |

All shortcuts are automatically ignored while typing inside any text input.

---

## Data & Storage

TAB Explorer stores everything locally in `chrome.storage.local`. There is no account, no cloud sync, and no external server.

| Key | Contents |
|---|---|
| `tabExplorerData` | Workspaces, folders, links, active workspace ID, and expanded-folder UI state — debounced writes on every change |
| `tabExplorerHistory` | Undo snapshot stack (up to 50 entries) — stored separately so it survives panel restarts |
| `lastKnownSession` | Rolling snapshot of currently open tabs, maintained by the background service worker for session restore |

**Data versioning & normalization**: stored records carry a version number. When data is loaded, any missing fields (color, starred, icon, etc.) are safely filled in with defaults, so upgrading the extension never corrupts existing data.

Your data never leaves your machine unless you explicitly use **Export**.

---

## Permissions

| Permission | Why it's needed |
|---|---|
| `tabs` | Read currently open tabs (to save them) and open new ones (to restore or open saved tabs) |
| `storage` | Persist workspaces, folders, links, undo history, and session snapshots in `chrome.storage.local` |
| `sidePanel` | Render TAB Explorer's UI as a Chrome side panel |
| `favicon` | Access Chrome's internal `_favicon/` API for high-quality site icons |
| `https://*/*` (host permission) | Fetch favicons and known-site icons via Google's favicon service for saved links |

TAB Explorer does **not** read page content, intercept requests, track browsing history, or transmit any data anywhere.

---

## Project Structure

```
TAB-Explorer/
├── background.js                     # MV3 service worker: opens side panel on icon click;
│                                     # maintains lastKnownSession for session restore
├── sidepanel.jsx                     # Side panel entry point, top-level layout, session
│                                     # restore modal, drag-drop on workspace header
└── core/
    └── sidepanel/
        ├── sidepanel.css             # All side panel styling
        ├── components/
        │   ├── Toolbar.jsx           # Save Tabs, Open Tabs, New Workspace, Undo buttons
        │   ├── SearchBar.jsx         # Cross-workspace search input
        │   ├── WorkspaceSwitcher.jsx # Horizontal workspace pill row with mouse-wheel scroll
        │   ├── Tree.jsx              # Recursive folder/link tree; drag and drop, inline rename
        │   ├── ContextMenu.jsx       # Right-click context menu with smart repositioning
        │   └── Modal.jsx             # New/Edit/Save Tabs/Batch-warning modals
        ├── hooks/
        │   └── useTabExplorer.js     # All state, CRUD, selection, undo, clipboard,
        │                             # drag & drop, tabs integration, keyboard shortcuts
        └── lib/
            ├── storage.js            # chrome.storage.local read/write, versioning, normalization
            ├── utils.js              # Constants (BATCH_SIZE, MAX_HISTORY, palette),
            │                         # makeId(), inferLinkIcon(), faviconUrl()
            └── icons.js              # Icon detection helpers
```

---

## Known Limitations

- **No cross-device sync** — data lives in `chrome.storage.local` on the current machine. Use Export/Import to move data between devices or profiles.
- **Chrome (Manifest V3) only** — no Firefox or Edge-specific build at this time.
- **No scroll-wheel during drag** — mouse-wheel scrolling is unavailable for the duration of a native HTML5 drag. Auto-scroll near the top/bottom edge of the list is provided as a substitute.
- **Tab restore scope** — session restore reopens URLs, not pinned/grouped/window-layout state.
- **Session restore on background-app Chrome** — on Windows, if Chrome is configured to keep running in the background after all windows close, the service worker never fully restarts, so `chrome.runtime.onStartup` is not a reliable signal. TAB Explorer uses a tab-presence comparison instead, which works correctly regardless of background-app settings.

---

## License

This project is licensed under the [MIT License](LICENSE).