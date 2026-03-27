# Tasks TODO List

## Current Task: Chats Direct Messages

- [x] Read the DM endpoint summary and current chats page integration
- [x] Add frontend DM types, client methods, and TanStack Query hooks for `/chat/dms`
- [x] Replace the ad hoc DM creation flow with the dedicated get-or-create DM flow
- [x] Render DMs correctly in the chats sidebar and selected chat header
- [x] Verify the touched chats files with targeted frontend checks

### Result

- Added dedicated frontend support for `GET /chat/dms` and `POST /chat/dms/:userId`, including query keys and mutation handling in the shared chat data layer.
- Updated the chats page to merge regular channels with DMs, keep DM lists refreshed on chat activity, and select newly created DMs immediately.
- Updated the channel modal to select exactly one target user for DMs and route DM creation through the idempotent backend DM endpoint instead of generic channel creation.
- Updated the sidebar and chat header to render DM display name, email, and avatar from `otherUser`.
- File-scoped ESLint passed for the touched chat data layer, modal, sidebar, and chats page files.

## Current Task: Chats Emoji Picker

- [x] Inspect the Frimousse API and current chat composer integration point
- [x] Integrate a Frimousse emoji picker into the shared chat composer used by `/chats`
- [x] Verify the chats page emoji picker integration with targeted frontend checks

### Result

- Integrated Frimousse into the shared `MessageInput` used by the workspace chats page, replacing the placeholder emoji action with a searchable picker in a popover.
- Emoji selection inserts into the textarea at the current cursor position, restores focus, preserves auto-resize behavior, and keeps the typing indicator flow active.
- File-scoped ESLint passed for the touched composer and chats page files.

## Current Task: Quick User Profile Popover

- [x] Inspect the existing chats page, shared UI primitives, and `/users/:id` API shape
- [x] Add shared users client and TanStack Query hook for user details
- [x] Create a reusable avatar-triggered quick user profile popover
- [x] Integrate the popover into chat message avatars on `/chats`
- [x] Verify the touched frontend files with targeted checks
- [x] Add GLightbox iframe-based large avatar preview inside the popover
- [x] Verify the GLightbox avatar preview integration

### Result

- Added shared `/users/:id` frontend client and a keyed TanStack Query hook with reusable query options, `staleTime`, and prefetch support.
- Added a reusable quick profile popover with loading and retry states, triggered from avatar clicks and prefetched on hover/focus.
- Integrated the popover into chat message avatars on the workspace chats page.
- File-scoped ESLint passed for all touched frontend files.
- App-wide `pnpm run check-types` still fails from unrelated pre-existing errors in editor, performance, auth, and socket files outside this change set.
- Added a GLightbox-powered large avatar preview from the popover using the library's iframe/external slide path with a generated HTML document around the image.
- File-scoped ESLint passed again after the GLightbox enhancement.

## Current Task: Chats Page UX Consistency

- [x] Inspect the existing `/chats` page integration
- [x] Replace the ad hoc composer with shared chat primitives
- [x] Verify the edited page with file-scoped lint

### Result

- The chats page now uses the shared `MessageInput`, `ConnectionStatus`, and `TypingIndicator` components.
- Message rendering is sorted chronologically so the newest message stays at the bottom.
- File-scoped ESLint passed for the touched frontend file.

## Current Task: Workspace Member Avatar Field

- [x] Inspect workspace member response shape
- [x] Add `avatarUrl` to enriched workspace member user payload
- [x] Verify the workspace package still typechecks for the touched files

### Result

- Workspace member payloads now include `user.avatarUrl` from the underlying user record.
- File-scoped ESLint passed for the touched backend files.

## Current Task: Teammates Pane Avatar Display

- [x] Read the teammates settings pane layout
- [x] Render the member avatar alongside display name and email
- [x] Verify the changed frontend files with targeted lint

### Result

- Teammates now show `user.avatarUrl` in the avatar component with initials fallback.
- File-scoped ESLint passed for the touched frontend files.

**Created:** March 26, 2026
**Based on:** Backend & Frontend Integration Analysis

---

## Priority 1: Critical Missing Features

### [ ] Task 1: Clients Backend Module

**Priority:** HIGH
**Effort:** 4-6 hours
**Status:** NOT STARTED

**Description:** Implement complete backend for Clients module

**Subtasks:**

- [ ] Create NestJS module structure (clients.module.ts)
- [ ] Create TypeORM entity (client.entity.ts)
- [ ] Create DTOs (create-client.dto.ts, update-client.dto.ts)
- [ ] Create service (clients.service.ts)
- [ ] Create controller (clients.controller.ts) with endpoints:
  - POST /clients - Create client
  - GET /clients - List clients (paginated, workspace-scoped)
  - GET /clients/:id - Get client details
  - PATCH /clients/:id - Update client
  - DELETE /clients/:id - Delete client
  - GET /clients/:id/projects - Get client projects
  - GET /clients/:id/notes - Get client notes
- [ ] Add workspace permissions
- [ ] Add Swagger documentation
- [ ] Write unit tests

**Files to Create:**

```
/apps/api/src/clients/
  ├── clients.module.ts
  ├── clients.service.ts
  ├── clients.controller.ts
  ├── entities/client.entity.ts
  ├── dto/create-client.dto.ts
  ├── dto/update-client.dto.ts
  └── dto/client-query.dto.ts
```

---

### [ ] Task 2: Clients Frontend Integration

**Priority:** HIGH
**Effort:** 3-4 hours
**Status:** NOT STARTED

**Description:** Create API client and integrate with frontend

**Subtasks:**

- [ ] Create clients-client.ts (API client)
- [ ] Create clients-query.ts (TanStack Query hooks)
- [ ] Create clients page at /w/:workspaceId/clients
- [ ] Create client detail page at /w/:workspaceId/clients/:id
- [ ] Remove mock data from /lib/data/clients.ts
- [ ] Add client form components
- [ ] Add client list/table component
- [ ] Add client detail view

**Files to Create:**

```
/apps/project-dashboard/lib/clients/
  ├── clients-client.ts
  └── clients-query.ts
/apps/project-dashboard/app/(protected)/w/[workspaceId]/clients/
  └── page.tsx
/apps/project-dashboard/app/(protected)/w/[workspaceId]/clients/[id]/
  └── page.tsx
```

---

## Priority 2: AI Features (High Impact)

### [ ] Task 3: AI Infrastructure Setup

**Priority:** HIGH
**Effort:** 2-3 hours
**Status:** NOT STARTED

**Description:** Set up AI provider and service layer

**Subtasks:**

- [ ] Choose AI provider (OpenAI/Anthropic/Ollama)
- [ ] Install dependencies:
  - `pnpm add ai @ai-sdk/openai` (or @ai-sdk/anthropic)
  - `pnpm add langchain @langchain/core`
  - `pnpm add pgvector` (if using pgvector)
- [ ] Add environment variables to .env.example:
  - OPENAI_API_KEY or ANTHROPIC_API_KEY
  - AI_MODEL=gpt-4o or claude-3-5-sonnet
- [ ] Create AI service module in backend
- [ ] Create AI configuration service
- [ ] Add rate limiting for AI endpoints
- [ ] Add AI usage tracking/logging

**Files to Create:**

```
/apps/api/src/ai/
  ├── ai.module.ts
  ├── ai.service.ts
  ├── ai.config.ts
  └── dto/ai-request.dto.ts
```

---

### [ ] Task 4: Journal AI Analysis

**Priority:** HIGH
**Effort:** 8-12 hours
**Status:** NOT STARTED

**Description:** Implement AI-powered journal analysis and insights

**Subtasks:**

- [ ] Create journal analysis service
- [ ] Implement sentiment analysis endpoint
- [ ] Implement mood trend analysis
- [ ] Create auto-summary generation
- [ ] Implement pattern detection
- [ ] Create frontend AI insights component
- [ ] Add weekly/monthly report generation
- [ ] Add mood prediction chart

**Backend Endpoints to Create:**

```
POST   /journal-entries/:id/analyze           - Analyze single entry
GET    /journal-entries/analysis/summary      - Get period summary
GET    /journal-entries/insights              - Get AI insights
POST   /journal-entries/generate-summary      - Generate period report
GET    /journal-entries/mood-trends           - Get mood trends
```

**Files to Create:**

```
/apps/api/src/journal-entries/journal-ai.service.ts
/apps/api/src/journal-entries/dto/analyze-entry.dto.ts
/apps/project-dashboard/lib/journal-entries/journal-ai-client.ts
/apps/project-dashboard/components/journal/ai-insights.tsx
```

---

### [ ] Task 5: Task & Goal Recommendations

**Priority:** HIGH
**Effort:** 10-15 hours
**Status:** NOT STARTED

**Description:** AI-powered task prioritization and goal recommendations

**Subtasks:**

- [ ] Create task recommendation service
- [ ] Implement smart prioritization algorithm
- [ ] Create goal achievement prediction
- [ ] Add workload balancing suggestions
- [ ] Create milestone generation
- [ ] Build frontend recommendation UI
- [ ] Add "Recommended Next Action" feature
- [ ] Create goal insights dashboard

**Backend Endpoints to Create:**

```
GET    /tasks/recommendations                 - Get task recommendations
GET    /tasks/priority-score/:id              - Calculate priority score
GET    /goals/insights                        - Get goal insights
POST   /goals/generate-milestones             - AI-generate milestones
GET    /performance/suggestions               - Get improvement suggestions
POST   /goals/predict-achievement/:id         - Predict success rate
```

**Files to Create:**

```
/apps/api/src/tasks/task-recommendation.service.ts
/apps/api/src/goals/goal-insights.service.ts
/apps/project-dashboard/lib/tasks/task-recommendations-client.ts
/apps/project-dashboard/lib/goals/goal-insights-client.ts
/apps/project-dashboard/components/tasks/recommended-tasks.tsx
/apps/project-dashboard/components/goals/goal-insights.tsx
```

---

## Priority 3: AI Features (Medium Impact)

### [ ] Task 6: Chat AI Assistant

**Priority:** MEDIUM
**Effort:** 15-20 hours
**Status:** NOT STARTED

**Description:** AI-powered chat assistance and summarization

**Subtasks:**

- [ ] Create chat AI service
- [ ] Implement message summarization
- [ ] Add smart reply suggestions
- [ ] Create AI assistant channel bot
- [ ] Implement thread summarization
- [ ] Add context-aware responses
- [ ] Build frontend AI assistant UI
- [ ] Add "Ask AI" feature in chat

**Backend Endpoints to Create:**

```
POST   /chat/messages/:id/summarize           - Summarize message thread
POST   /chat/ai-reply                         - Generate AI reply
GET    /chat/channels/:id/summary             - Get channel summary
POST   /chat/ai/ask                           - Ask AI assistant
POST   /chat/messages/suggest-reply           - Suggest reply
GET    /chat/channels/:id/key-points          - Extract key points
```

**Files to Create:**

```
/apps/api/src/chat/chat-ai.service.ts
/apps/project-dashboard/lib/chat/chat-ai-client.ts
/apps/project-dashboard/components/chat/ai-assistant.tsx
/apps/project-dashboard/components/chat/message-summary.tsx
/apps/project-dashboard/components/chat/smart-replies.tsx
```

---

### [ ] Task 7: Performance Insights

**Priority:** MEDIUM
**Effort:** 6-10 hours
**Status:** NOT STARTED

**Description:** AI-powered performance analysis and insights

**Subtasks:**

- [ ] Create performance analysis service
- [ ] Implement productivity pattern detection
- [ ] Add focus time optimization
- [ ] Create burnout risk detection
- [ ] Generate weekly performance reports
- [ ] Build insights dashboard UI
- [ ] Add productivity trends chart
- [ ] Create goal suggestion engine

**Backend Endpoints to Create:**

```
GET    /performance/insights                  - Get AI insights
GET    /performance/weekly-report             - Generate weekly report
GET    /performance/patterns                  - Detect patterns
POST   /performance/generate-goals            - Suggest new goals
GET    /performance/burnout-risk              - Assess burnout risk
GET    /performance/focus-time-analysis       - Analyze focus patterns
```

**Files to Create:**

```
/apps/api/src/performance/performance-ai.service.ts
/apps/project-dashboard/lib/performance/performance-ai-client.ts
/apps/project-dashboard/components/performance/ai-insights.tsx
/apps/project-dashboard/components/performance/weekly-report.tsx
```

---

### [ ] Task 8: Note Summarization & Audio Transcription

**Priority:** MEDIUM
**Effort:** 10-15 hours
**Status:** NOT STARTED

**Description:** Auto-summarize notes and transcribe audio

**Subtasks:**

- [ ] Create note summarization service
- [ ] Implement audio transcription (Whisper API)
- [ ] Add action item extraction
- [ ] Create smart tagging system
- [ ] Build meeting notes template
- [ ] Add summary generation UI
- [ ] Create transcription progress indicator
- [ ] Add searchable transcript text

**Backend Endpoints to Create:**

```
POST   /notes/:id/summarize                   - Summarize note
POST   /notes/transcribe-audio                - Transcribe audio note
POST   /notes/extract-action-items            - Extract tasks from note
POST   /notes/auto-tag                        - Auto-generate tags
GET    /notes/:id/key-points                  - Extract key points
POST   /notes/meeting-to-tasks                - Convert meeting to tasks
```

**Files to Create:**

```
/apps/api/src/notes/note-ai.service.ts
/apps/project-dashboard/lib/notes/note-ai-client.ts
/apps/project-dashboard/components/notes/note-summary.tsx
/apps/project-dashboard/components/notes/audio-transcription.tsx
/apps/project-dashboard/components/notes/action-items.tsx
```

---

## Priority 4: AI Features (Lower Impact)

### [ ] Task 9: Smart Categorization

**Priority:** LOW
**Effort:** 6-8 hours
**Status:** NOT STARTED

**Description:** Auto-categorize transactions and tasks

**Subtasks:**

- [ ] Create categorization service
- [ ] Implement transaction auto-categorization
- [ ] Add task categorization suggestions
- [ ] Create expense pattern detection
- [ ] Build budget recommendations
- [ ] Add category learning from user behavior
- [ ] Create manual override UI
- [ ] Add category confidence scores

**Backend Endpoints to Create:**

```
POST   /transactions/:id/categorize           - Auto-categorize
GET    /transactions/suggestions              - Get category suggestions
GET    /budgets/recommendations               - Budget optimization tips
POST   /transactions/analyze-patterns         - Detect spending patterns
GET    /transactions/category-stats           - Category statistics
POST   /tasks/suggest-category                - Suggest task category
```

**Files to Create:**

```
/apps/api/src/transactions/categorization.service.ts
/apps/project-dashboard/lib/transactions/categorization-client.ts
/apps/project-dashboard/components/transactions/category-suggestions.tsx
/apps/project-dashboard/components/budgets/recommendations.tsx
```

---

## Priority 5: Page Integration Cleanup

### [ ] Task 10: Budgets Page Integration

**Priority:** MEDIUM
**Effort:** 1-2 hours
**Status:** NOT STARTED

**Description:** Create dedicated budgets page in workspace route

**Subtasks:**

- [ ] Create /w/:workspaceId/budgets page
- [ ] Add budget list view
- [ ] Add budget form
- [ ] Add spending summary chart
- [ ] Connect to existing API client

---

### [ ] Task 11: Habits Page Integration

**Priority:** MEDIUM
**Effort:** 1-2 hours
**Status:** NOT STARTED

**Description:** Create dedicated habits page in workspace route

**Subtasks:**

- [ ] Create /w/:workspaceId/habits page
- [ ] Add habit list with completion status
- [ ] Add habit form
- [ ] Add habit streak visualization
- [ ] Connect to existing API client

---

### [ ] Task 12: Journal Page Integration

**Priority:** MEDIUM
**Effort:** 2-3 hours
**Status:** NOT STARTED

**Description:** Create dedicated journal page in workspace route

**Subtasks:**

- [ ] Create /w/:workspaceId/journal page
- [ ] Add journal entry list
- [ ] Add journal editor
- [ ] Add mood tracking visualization
- [ ] Add AI insights panel (when Task 4 complete)
- [ ] Connect to existing API client

---

### [ ] Task 13: Performance Page Integration

**Priority:** LOW
**Effort:** 1-2 hours
**Status:** NOT STARTED

**Description:** Create dedicated performance page in workspace route

**Subtasks:**

- [ ] Create /w/:workspaceId/performance page
- [ ] Add KPI dashboard
- [ ] Add charts for metrics
- [ ] Add AI insights panel (when Task 7 complete)
- [ ] Connect to existing API client

---

### [ ] Task 14: Inbox Page Integration

**Priority:** LOW
**Effort:** 2-3 hours
**Status:** NOT STARTED

**Description:** Create unified inbox for notifications and updates

**Subtasks:**

- [ ] Create /w/:workspaceId/inbox page
- [ ] Aggregate notifications, mentions, updates
- [ ] Add notification preferences
- [ ] Add read/unread management
- [ ] Connect to notifications API

---

### [ ] Task 15: Habit Logs Page Integration

**Priority:** LOW
**Effort:** 1-2 hours
**Status:** NOT STARTED

**Description:** Create habit logs view page

**Subtasks:**

- [ ] Create /w/:workspaceId/habit-logs page
- [ ] Add calendar view
- [ ] Add habit log list
- [ ] Add filtering by habit/date
- [ ] Connect to existing API client

---

## Summary

### Total Tasks: 15

| Priority        | Count  | Estimated Hours |
| --------------- | ------ | --------------- |
| HIGH (Critical) | 3      | 9-13 hours      |
| HIGH (AI)       | 2      | 18-27 hours     |
| MEDIUM (AI)     | 2      | 16-25 hours     |
| MEDIUM (Pages)  | 3      | 4-7 hours       |
| LOW (AI)        | 1      | 6-8 hours       |
| LOW (Pages)     | 4      | 5-9 hours       |
| **TOTAL**       | **15** | **58-89 hours** |

### AI-Specific Tasks: 6

- Task 3: AI Infrastructure Setup
- Task 4: Journal AI Analysis
- Task 5: Task & Goal Recommendations
- Task 6: Chat AI Assistant
- Task 7: Performance Insights
- Task 8: Note Summarization & Audio Transcription
- Task 9: Smart Categorization

**Total AI Implementation:** 55-80 hours

---

## Recommended Order of Execution

1. **Week 1:** Task 1 (Clients Backend), Task 2 (Clients Frontend), Task 3 (AI Setup)
2. **Week 2:** Task 4 (Journal AI)
3. **Week 3:** Task 5 (Task/Goal Recommendations)
4. **Week 4:** Task 7 (Performance Insights), Task 10-13 (Page integrations)
5. **Week 5:** Task 6 (Chat AI)
6. **Week 6:** Task 8 (Note Summarization), Task 9 (Smart Categorization), Task 14-15

---

## Notes

- All AI features require an AI provider API key (OpenAI, Anthropic, or self-hosted)
- Consider implementing rate limiting and usage tracking for AI features
- Add user preferences for AI features (opt-in/opt-out)
- Consider cost implications of AI API calls
- Add caching for AI-generated content to reduce API calls
