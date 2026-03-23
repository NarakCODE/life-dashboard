# Chat UX/UI Integration Design

## 🎯 Recommended Approach: Hybrid Model

### Primary: Full-Page Chat (Slack/Discord Style)
**URL:** `/w/[workspaceId]/chat` or `/w/[workspaceId]/chat/[channelId]`

**Why:**
- Chat is a core workspace communication tool
- Users expect dedicated space for conversations
- Easier to scale with threads, files, search

---

## 📐 Layout Options

### Option A: Classic 3-Column (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]   🔍 Search                    🔔 👤 Profile        │ ← Top Bar
├──────────┬──────────────────────────────────┬───────────────┤
│          │                                  │               │
│ Workspaces│  #general                      │ @alice        │
│  - WS1   │  ┌──────────────────────────┐   │ ┌───────────┐ │
│  - WS2   │  │ 👋 Welcome message!      │   │ │ Online    │ │
│          │  │ How's everyone doing?    │   │ ├───────────┤ │
│ Channels │  └──────────────────────────┘   │ │ @bob      │ │
│  #general│                                  │ │ @carol    │ │
│  #random │  ┌──────────────────────────┐   │ └───────────┘ │
│  #eng    │  │ Working on the new       │   │               │
│  #design │  │ feature today 🚀         │   │               │
│          │  └──────────────────────────┘   │               │
│ DMs      │                                  │               │
│  @alice  │  ┌── Message Input ────────┐   │               │
│  @bob    │  │ [😊] Type message... [📎]│   │               │
│          │  └──────────────────────────┘   │               │
│          │                                  │               │
├──────────┴──────────────────────────────────┴───────────────┤
│  💬 Chat    📁 Projects    ✅ Tasks    📊 Dashboard         │ ← Bottom Nav (Mobile)
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                  ↑
    Sidebar (200px)     Main Content      Members/Info
```

**Breakdown:**
| Column | Width | Content |
|--------|-------|---------|
| Left Sidebar | 260px | Workspaces + Channels + DMs |
| Main Chat | Flexible | Messages + Input |
| Right Panel | 240px | Members / Thread / Info |

---

### Option B: Collapsible Sidebar (Space-Saving)

```
┌───────────────────────────────────────────────────────────┐
│  ☰  │  #general                     👤 @alice, @bob...   │
├─────┼─────────────────────────────────────────────────────┤
│  💬 │                                                     │
│  📁 │  ┌─────────────────────────────────────────────┐   │
│  ✅ │  │  👤 Alice          10:30 AM                 │   │
│  📊 │  │  Hey team! The designs are ready for review │   │
│  💰 │  └─────────────────────────────────────────────┘   │
│  🎯 │                                                     │
│     │  ┌─────────────────────────────────────────────┐   │
│     │  │  👤 Bob              10:32 AM               │   │
│     │  │  Great! I'll check them out now 👀          │   │
│     │  └─────────────────────────────────────────────┘   │
│     │                                                     │
│     │  ┌── Type message... ────────────────────────┐   │
│     │  │                                             │   │
│     │  └─────────────────────────────────────────────┘   │
│     │                                                     │
└─────┴─────────────────────────────────────────────────────┘
```

**For:** Smaller screens or when multitasking

---

## 🎨 Page Structure Recommendation

### 1. Main Chat Page (Primary)
**Route:** `/w/[workspaceId]/chat/[[...channelId]]`

**Components:**
- `ChatLayout` - 3-column responsive layout
- `ChannelSidebar` - Channels, DMs, unread badges
- `MessageList` - Virtualized scroll, date separators
- `MessageInput` - Text, emoji, attachments
- `ThreadPanel` - Slide-out thread view
- `MemberList` - Online status, roles

### 2. Contextual Mini-Chat (Secondary)
**Routes:** 
- `/w/[workspaceId]/projects/[id]` - Project discussions
- `/w/[workspaceId]/tasks` - Task comments

**Implementation:** Collapsible right panel or tab

### 3. Quick Access (Always Available)
**Location:** App-wide floating button or header

---

## 📱 Responsive Behavior

### Desktop (1200px+)
```
[Sidebar] [Chat Main] [Members Panel]
  260px      flex        240px
```

### Tablet (768px - 1199px)
```
[Sidebar*] [Chat Main]
  60px       flex

*Icons only, expands on hover
```

### Mobile (< 768px)
```
[Chat Main Fullscreen]

Sidebar → Bottom sheet
Members → Slide from right
```

---

## 🎭 UI Components Design

### Channel Sidebar
```tsx
<ChannelSidebar>
  <WorkspaceHeader />
  <Section title="Channels">
    <ChannelItem 
      name="#general" 
      unreadCount={3}
      isActive 
    />
    <ChannelItem name="#random" />
    <ChannelItem name="#engineering" muted />
  </Section>
  <Section title="Direct Messages">
    <DMItem 
      user={alice} 
      status="online"
      unreadCount={1}
    />
    <DMItem user={bob} status="away" />
  </Section>
</ChannelSidebar>
```

### Message Bubble
```
┌────────────────────────────────────────┐
│ 👤 Alice                    10:30 AM   │
│                                        │
│ Hey team! The designs are ready        │
│ for review. Check the link below:      │
│                                        │
│ [🖼️ Design Mockup v2.png]              │
│                                        │
│ 👍 3  💬 2  ⋯                          │
└────────────────────────────────────────┘
```

### Message Input
```
┌────────────────────────────────────────────┐
│ [📎] [😊] [🎤]                             │
│ ┌────────────────────────────────────────┐ │
│ │ Type a message...                      │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                    [Send]  │
└────────────────────────────────────────────┘
```

---

## 🔄 Integration Points

### 1. Main Navigation
Add to sidebar menu:
```
Dashboard
Inbox
My Tasks
Projects
💬 Chat  ← New (with unread badge)
Budgets
...
```

### 2. Quick Actions
Header bar additions:
- 🔔 Notification bell (existing)
- 💬 Chat quick-access dropdown
- 🔍 Global search (includes messages)

### 3. Contextual Links
From other pages:
- Project page → "Discuss in #project-name"
- Task card → "View 5 comments"
- User profile → "Send message"

---

## 🎨 Visual Design Specs

### Color Coding
| Type | Color | Usage |
|------|-------|-------|
| Channel (unread) | `text-primary` | Bold white |
| Channel (read) | `text-muted` | Gray |
| Mention | `bg-blue-500/20` | Blue highlight |
| Direct Message | `text-primary` | White |
| Online | `bg-green-500` | Green dot |
| Away | `bg-yellow-500` | Yellow dot |
| Offline | `bg-gray-500` | Gray dot |

### Typography
- Channel name: `text-sm font-medium`
- Username: `text-sm font-semibold`
- Message: `text-sm leading-relaxed`
- Timestamp: `text-xs text-muted-foreground`

### Spacing
- Sidebar padding: `px-3 py-2`
- Message padding: `px-4 py-3`
- Message gap: `gap-1`
- Avatar size: `36px`

---

## 🚀 Implementation Priority

### Phase 1: MVP (1-2 weeks)
1. **Full-page chat** at `/w/[workspaceId]/chat`
2. Channel sidebar with unread badges
3. Message list with virtual scroll
4. Basic message input
5. WebSocket integration

### Phase 2: Polish (1 week)
1. Thread replies
2. Emoji reactions
3. File attachments
4. Search messages
5. Mobile responsive

### Phase 3: Integration (1 week)
1. Contextual chat in projects
2. Task comments
3. @mentions notifications
4. Chat in notifications center

---

## 📝 File Structure

```
app/(protected)/w/[workspaceId]/
├── chat/
│   ├── page.tsx                    # Main chat page
│   ├── layout.tsx                  # Chat layout wrapper
│   └── [[...channelId]]/
│       └── page.tsx                # Channel-specific view
└── (with-chat)/                    # Routes with chat panel
    ├── projects/
    │   └── [id]/
    │       └── page.tsx
    └── layout.tsx                  # Layout with collapsible chat

components/chat/
├── ChatLayout.tsx                  # Main 3-column layout
├── ChannelSidebar.tsx              # Left sidebar
├── ChannelItem.tsx                 # Single channel row
├── MessageList.tsx                 # Virtualized message list
├── MessageItem.tsx                 # Single message bubble
├── MessageInput.tsx                # Input + toolbar
├── ThreadPanel.tsx                 # Slide-out thread
├── MemberList.tsx                  # Right panel members
├── ChatHeader.tsx                  # Channel header
└── EmptyState.tsx                  # No channel selected

lib/chat/
├── use-chat-socket.ts              # WebSocket hook
├── use-channels.ts                 # Channels query
├── use-messages.ts                 # Messages query
└── chat-context.tsx                # Global chat state
```

---

## 🎯 Recommendation

**Start with Option A (Classic 3-Column)** as the main chat page at `/w/[workspaceId]/chat`.

**Why:**
- Most familiar to users (Slack, Discord, Teams)
- Scales well with features (threads, files, search)
- Clear separation of navigation/content/context
- Works well on desktop (primary workspace environment)

**Then add:**
- Collapsible mode for smaller screens
- Quick chat widget for quick DMs
- Contextual chat in project pages
