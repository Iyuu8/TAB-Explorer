You’re right, the nested triple backticks broke the outer code block. Here is the whole explanation inside one single code block, using indented snippets instead:

```md
# TabExplorer Chrome Extension Explanation

This project is a Chrome extension built with Plasmo. Its main feature is a Chrome Side Panel application called TabExplorer, designed to help users save, organize, search, and reopen browser tabs using workspaces, folders, and links.

## Core Purpose

TabExplorer acts like a lightweight bookmark and tab-session manager. Instead of only saving individual bookmarks, the extension lets users organize groups of tabs into workspaces and folders, then reopen them later in controlled batches.

## Main Extension Surface

The primary UI is implemented in sidepanel.jsx.

Plasmo automatically treats this file as a side panel entry point. The side panel renders the full TabExplorer interface, including:

- Header with branding
- Toolbar actions
- Search bar
- Workspace switcher
- Workspace tree
- Context menu
- Modal dialogs
- Toast notifications
- Status bar

The side panel uses the custom hook useTabExplorer() as its central state and behavior engine.

## Background Script

The file background.js configures Chrome’s side panel behavior.

It calls:

    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

This makes the extension’s side panel open when the user clicks the extension toolbar icon. The behavior is set both when the extension is installed and when the background service worker starts.

## Data Model

The extension stores three main kinds of data:

1. Workspaces
   A workspace is a top-level container, such as "Personal", "Work", or "Research".

2. Folders
   Folders belong to a workspace and can be nested inside other folders.

3. Links
   Links represent saved browser tabs. Each link stores a title, URL, favicon, workspace ID, parent folder ID, creation time, and update time.

The default fresh-install state creates one empty workspace named "Personal".

## Persistence

Persistence is handled in core/sidepanel/lib/storage.js.

The extension saves all user data into chrome.storage.local under the key:

    tabExplorerData

This means saved workspaces, folders, links, active workspace, and expanded folder state survive browser restarts, side panel reloads, and extension reloads.

The storage layer also listens for changes through chrome.storage.onChanged, allowing the side panel to update if another extension view modifies the same data.

## Main State Engine

Most functionality lives in:

    core/sidepanel/hooks/useTabExplorer.js

This hook manages:

- Workspace state
- Folder state
- Link state
- Active workspace
- Expanded folders
- Collapsed workspace tree state
- Search query
- Selected items
- Rename state
- Clipboard state
- Context menu state
- Modal state
- Toast messages
- Undo history

It exposes all actions needed by the UI components.

## Workspace Features

Users can:

- Create new workspaces
- Switch between workspaces
- Rename workspaces
- Delete workspaces
- Select a workspace row
- Collapse or expand the active workspace tree
- Open all links in a workspace

The WorkspaceSwitcher component displays each workspace as a selectable pill.

## Folder Features

Users can:

- Create folders
- Create nested folders
- Expand and collapse folders
- Rename folders
- Delete folders
- Count all nested items under a folder
- Move folders through cut and paste
- Copy folders recursively
- Open all links contained inside a folder and its descendants

Folders are rendered hierarchically in Tree.jsx.

## Link Features

Users can:

- Manually create links
- Save current Chrome tabs as links
- Rename links
- Delete links
- Copy or cut links
- Paste links into folders or workspace root
- Double-click a link to open it in a new Chrome tab
- Open selected links through toolbar or context menu actions

Links can display favicons when available. If a favicon fails to load, the UI falls back to a generic link icon.

## Saving Current Tabs

The "save tabs" action opens a modal that lets the user save all current-window tabs into either:

- The workspace root
- A selected folder

The user can choose between two modes:

- Append: add current tabs without removing existing links
- Replace: remove existing links in the target folder/root, then save the current tabs

When appending, duplicate URLs already present in the target are skipped.

Chrome internal pages such as chrome:// URLs are ignored.

## Opening Tabs

The "open tabs" action can open:

- The whole active workspace
- A selected folder and all nested links
- A selected link
- Multiple selected folders/links

Opening is handled in batches.

The constants are defined in utils.js:

    BATCH_SIZE = 20
    BATCH_DELAY_MS = 300

If more than 20 tabs would be opened, the extension shows a warning modal before continuing. This prevents accidentally freezing Chrome by opening a very large number of tabs at once.

## Search

Search is global across all workspaces.

When the user types into the search bar, the tree switches from hierarchical mode to a flat search result mode.

Search matches:

- Folder names
- Link titles
- Link URLs

Search results show the workspace name and folder path so users can understand where each result belongs.

## Selection System

The extension supports file-explorer-style selection.

Users can:

- Click to select one item
- Ctrl/Cmd-click to add or remove items from the selection
- Shift-click to select a visible range
- Click empty space to clear the selection

The selection system works for folders, links, and the active workspace row.

## Clipboard Features

The extension has an internal clipboard for organizing saved items.

Users can:

- Cut selected folders or links
- Copy selected folders or links
- Paste into a folder
- Paste into the workspace root

Copying a folder duplicates the folder and all nested child folders and links.

Cutting moves selected items. The code prevents dropping a folder into itself or one of its descendants.

## Rename Features

Users can rename items through:

- Context menu
- Double-clicking folders
- F2 keyboard shortcut for selected folders or links

Renaming is inline inside the tree.

Supported rename targets are:

- Workspaces
- Folders
- Links

## Delete Features

Users can delete:

- Individual links
- Individual folders
- Multiple selected items
- Entire workspaces

Deleting a folder also deletes all nested folders and links inside it.

Deleting a workspace removes the workspace and all folders/links belonging to it.

## Undo

The extension keeps an undo history for mutating operations.

Before changes such as create, rename, delete, paste, or save tabs, the hook stores a snapshot of:

- Workspaces
- Folders
- Links

The maximum undo history size is:

    MAX_HISTORY = 50

Undo restores the previous snapshot and shows a toast message.

## Keyboard Shortcuts

The side panel supports several keyboard shortcuts:

- Ctrl/Cmd + A: select all visible items
- Ctrl/Cmd + C: copy selection
- Ctrl/Cmd + X: cut selection
- Ctrl/Cmd + V: paste into selected folder or workspace root
- Ctrl/Cmd + Z: undo
- Ctrl/Cmd + Shift + S: save current tabs
- Escape: clear selection
- Delete / Backspace: delete selected items
- F2: rename selected folder or link

Keyboard shortcuts are ignored while typing in inputs or textareas.

## Context Menu

Right-clicking workspaces, folders, or links opens a custom context menu.

Depending on the target, the menu can include:

- Open
- Rename
- Cut
- Copy
- Paste
- New Folder
- New Link
- Delete
- Properties

The Properties modal shows metadata such as creation time, update time, and link URL.

## Modal System

The Modal.jsx component handles all dialog flows:

- New Workspace
- New Folder
- New Link
- Save Current Tabs
- Open Many Tabs warning
- Properties

Each modal receives callbacks from sidepanel.jsx, which delegates the actual behavior to useTabExplorer().

## Styling

The side panel UI is styled by:

    core/sidepanel/sidepanel.css

The design uses a light blue-gray interface with compact toolbar buttons, workspace pills, tree rows, hover states, selected states, modals, context menus, and toast notifications.

## Chrome Permissions

The extension declares these permissions in package.json:

    "permissions": ["tabs", "storage", "sidePanel"]

These are needed because the extension:

- Reads current browser tabs
- Opens new tabs
- Saves data to local extension storage
- Uses Chrome’s side panel API

It also declares:

    "host_permissions": ["https://*/*"]

## Important Note

The side panel includes a button that tries to open:

    tabs/fullpage.html

through:

    chrome.runtime.getURL("tabs/fullpage.html")

However, based on the current project files, no tabs/fullpage.html file exists. This means the "Open in full view" button may currently open a missing extension page unless that file is generated elsewhere or added later.

## Summary

TabExplorer is a Plasmo-powered Chrome side panel extension for managing tab collections. It lets users create workspaces, organize saved tabs into nested folders, search across all saved links, save current browser tabs, reopen tab groups, use multi-selection, copy/cut/paste items, rename and delete entries, inspect properties, and undo changes.

Its data is persisted locally with chrome.storage.local, and its UI behaves similarly to a compact file explorer for browser tabs.
```