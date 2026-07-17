// Shared constants & small helpers used across the TabExplorer side panel.

export const BATCH_SIZE = 20
export const BATCH_DELAY_MS = 300
export const MAX_HISTORY = 50

export const FOLDER_PALETTE = ["#2B2B2B", "#1f3a63", "#2f6b3a", "#7a3b2e", "#5a3b7a", "#2e6b6b"]
export const LINK_ICON_OPTIONS = [
  { label: "Auto", value: "" },
  { label: "ChatGPT", value: faviconUrl("chatgpt.com") },
  { label: "Claude", value: faviconUrl("claude.ai") },
  { label: "Gemini", value: faviconUrl("gemini.google.com") },
  { label: "DeepSeek", value: faviconUrl("deepseek.com") },
  { label: "Kimi", value: faviconUrl("kimi.moonshot.cn") },
  { label: "YouTube", value: faviconUrl("youtube.com") },
  { label: "Google Drive", value: faviconUrl("drive.google.com") },
  { label: "Gmail", value: faviconUrl("mail.google.com") },
  { label: "Google", value: faviconUrl("google.com") },
  { label: "Facebook", value: faviconUrl("facebook.com") },
  { label: "Instagram", value: faviconUrl("instagram.com") },
  { label: "LinkedIn", value: faviconUrl("linkedin.com") },
  { label: "GitHub", value: faviconUrl("github.com") },
  { label: "Notion", value: faviconUrl("notion.so") }
]

export function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

export function inferLinkIcon(url = "", title = "") {
  const text = `${url} ${title}`.toLowerCase()
  const pairs = [
    ["chatgpt", "chatgpt.com"],
    ["openai", "chatgpt.com"],
    ["claude", "claude.ai"],
    ["gemini", "gemini.google.com"],
    ["bard", "gemini.google.com"],
    ["deepseek", "deepseek.com"],
    ["kimi", "kimi.moonshot.cn"],
    ["youtube", "youtube.com"],
    ["youtu.be", "youtube.com"],
    ["drive.google", "drive.google.com"],
    ["docs.google", "docs.google.com"],
    ["sheets.google", "sheets.google.com"],
    ["slides.google", "slides.google.com"],
    ["mail.google", "mail.google.com"],
    ["gmail", "mail.google.com"],
    ["calendar.google", "calendar.google.com"],
    ["meet.google", "meet.google.com"],
    ["google", "google.com"],
    ["facebook", "facebook.com"],
    ["instagram", "instagram.com"],
    ["linkedin", "linkedin.com"],
    ["github", "github.com"],
    ["notion", "notion.so"],
    ["x.com", "x.com"],
    ["twitter", "x.com"],
    ["reddit", "reddit.com"],
    ["whatsapp", "whatsapp.com"],
    ["slack", "slack.com"],
    ["figma", "figma.com"]
  ]
  const match = pairs.find(([needle]) => text.includes(needle))
  if (match) return faviconUrl(match[1])
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "")
    return hostname ? faviconUrl(hostname) : ""
  } catch {
    return ""
  }
}

// Fresh-install state: a single empty "Personal" workspace, nothing else.
// No demo folders/links are seeded per the product spec.
export function emptyState() {
  const now = Date.now()
  const personal = { id: makeId(), name: "Personal", color: "#2f6690", createdAt: now, updatedAt: now }
  return {
    workspaces: [personal],
    folders: [],
    links: [],
    activeWorkspaceId: personal.id,
    expanded: {}
  }
}
