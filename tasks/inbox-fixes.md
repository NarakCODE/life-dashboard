# Inbox Page Fixes

**Created:** March 28, 2026
**Source:** API Integration Audit + InboxPage.tsx Analysis

---

## Phase 1: Critical Fixes (4-6 hours)

### [ ] Task 1: Add Delete Notification Functionality

**Priority:** HIGH
**Effort:** 1 hour
**Status:** NOT STARTED

**Description:** Backend endpoint `DELETE /notifications/:id` exists but is not exposed in the UI.

**Subtasks:**

- [ ] Add `deleteNotification` to `lib/notifications/notifications-client.ts`
- [ ] Add `useDeleteNotificationMutation` hook to `lib/notifications/notifications-query.ts`
- [ ] Add delete button in selected notification view
- [ ] Add confirmation dialog (use existing AlertDialog component)
- [ ] Implement optimistic update with rollback on error
- [ ] Show toast success/error messages

**Files to Modify:**
```
/apps/project-dashboard/lib/notifications/notifications-client.ts
/apps/project-dashboard/lib/notifications/notifications-query.ts
/apps/project-dashboard/components/inbox/InboxPage.tsx
```

**Note:** Mock data is available for testing via the notification seeder. Run:
```bash
cd apps/api
pnpm seed:notifications --user <userId> --workspace <workspaceId>
```

---

### [ ] Task 2: URL Persistence for Selection

**Priority:** MEDIUM  
**Effort:** 1 hour  
**Status:** NOT STARTED

**Description:** Selected notification is lost on page refresh. Persist in URL query param.

**Subtasks:**

- [ ] Update selection state to sync with `notificationId` query param
- [ ] Use `router.push` with `shallow: true` to update URL without reload
- [ ] Restore selection on mount from query param
- [ ] Clear query param when deselected

**Files to Modify:**
```
/apps/project-dashboard/components/inbox/InboxPage.tsx
```

---

### [ ] Task 3: Keyboard Navigation (Accessibility)

**Priority:** MEDIUM  
**Effort:** 1.5 hours  
**Status:** NOT STARTED

**Description:** Add keyboard navigation for better accessibility and power user experience.

**Subtasks:**

- [ ] Add arrow up/down to navigate notifications list
- [ ] Add Enter to select notification
- [ ] Add `R` to toggle read/unread
- [ ] Add `Delete` to remove notification
- [ ] Add `Escape` to deselect
- [ ] Add proper ARIA roles: `role="listbox"`, `role="option"`
- [ ] Add `aria-selected` for selected state
- [ ] Add focus management (scroll selected into view)

**Files to Modify:**
```
/apps/project-dashboard/components/inbox/InboxPage.tsx
/apps/project-dashboard/hooks/use-inbox-keyboard.ts (new)
```

---

### [ ] Task 4: Optimistic Updates for Mark-as-Read

**Priority:** MEDIUM  
**Effort:** 0.5 hours  
**Status:** NOT STARTED

**Description:** Reduce perceived latency by updating UI immediately.

**Subtasks:**

- [ ] Update `useMarkNotificationReadMutation` to use `onMutate`
- [ ] Implement rollback on error
- [ ] Apply same pattern to `useMarkAllNotificationsReadMutation`

**Files to Modify:**
```
/apps/project-dashboard/lib/notifications/notifications-query.ts
```

---

### [ ] Task 5: Pagination UI

**Priority:** MEDIUM  
**Effort:** 1.5 hours  
**Status:** NOT STARTED

**Description:** Current implementation has hardcoded limit of 100 with no pagination UI.

**Subtasks:**

- [ ] Add `Load more` button at bottom of list
- [ ] Or implement infinite scroll with react-intersection-observer
- [ ] Show total count (e.g., "Showing 50 of 234 notifications")
- [ ] Update query to use cursor or offset pagination
- [ ] Handle empty state after filtering

**Files to Modify:**
```
/apps/project-dashboard/components/inbox/InboxPage.tsx
/apps/project-dashboard/lib/notifications/notifications-query.ts
```

---

### [ ] Task 6: Extended Notification Types

**Priority:** MEDIUM  
**Effort:** 2 hours  
**Status:** NOT STARTED

**Description:** Current types are limited. Add more types for comprehensive inbox coverage.

**New Types to Add:**
- `task_assigned` - When a task is assigned to you
- `project_mention` - When mentioned in a project
- `chat_message` - New chat message (if not using real-time only)
- `workspace_invitation` - New workspace invitation
- `comment_reply` - Reply to your comment

**Subtasks:**

- [ ] Update backend `NotificationType` enum
- [ ] Update frontend `NotificationType` enum
- [ ] Add icons for new types (use Phosphor Icons)
- [ ] Add labels for new types
- [ ] Update `notification-utils.tsx` with type-specific logic
- [ ] Update `getNotificationHref` for new type routing

**Files to Modify:**
```
/apps/api/src/notifications/entities/notification.entity.ts
/apps/api/src/notifications/dto/notification-response.dto.ts
/apps/project-dashboard/lib/notifications/types.ts
/apps/project-dashboard/lib/notifications/notification-utils.tsx
```

---

## Phase 2: Enhanced Features (6-8 hours)

### [ ] Task 7: Archive Functionality

**Priority:** LOW  
**Effort:** 2 hours  
**Status:** NOT STARTED

**Description:** Allow users to archive notifications instead of deleting them.

**Subtasks:**

- [ ] Add `isArchived` field to notification entity (backend)
- [ ] Add `archivedAt` timestamp field
- [ ] Create `PATCH /notifications/:id/archive` endpoint
- [ ] Add `useArchiveNotificationMutation` hook
- [ ] Add Archive tab alongside All/Unread
- [ ] Add archive button to selected notification view
- [ ] Exclude archived from default queries

**Files to Modify:**
```
/apps/api/src/notifications/entities/notification.entity.ts
/apps/api/src/notifications/dto/archive-notification.dto.ts (new)
/apps/api/src/notifications/notifications.service.ts
/apps/api/src/notifications/notifications.controller.ts
/apps/project-dashboard/lib/notifications/notifications-client.ts
/apps/project-dashboard/lib/notifications/notifications-query.ts
/apps/project-dashboard/components/inbox/InboxPage.tsx
```

---

### [ ] Task 8: Search Inbox

**Priority:** LOW  
**Effort:** 1.5 hours  
**Status:** NOT STARTED

**Description:** Allow users to search notifications by title, body, or context.

**Subtasks:**

- [ ] Add search input component
- [ ] Implement debounced search (300ms)
- [ ] Add search query to API params
- [ ] Highlight matching text in results
- [ ] Clear search with Escape
- [ ] Show search result count

**Files to Modify:**
```
/apps/project-dashboard/components/inbox/InboxSearch.tsx (new)
/apps/project-dashboard/components/inbox/InboxPage.tsx
/apps/api/src/notifications/dto/query-notification.dto.ts
```

---

### [ ] Task 9: Group by Date

**Priority:** LOW  
**Effort:** 1 hour  
**Status:** NOT STARTED

**Description:** Group notifications by date for better scanning.

**Groups:**
- Today
- Yesterday
- This Week (Monday-Sunday)
- This Month
- Older

**Subtasks:**

- [ ] Create date grouping utility function
- [ ] Add section headers with sticky positioning
- [ ] Use `formatDistanceToNow` for relative dates
- [ ] Handle timezone correctly

**Files to Modify:**
```
/apps/project-dashboard/lib/utils.ts (add groupByDate function)
/apps/project-dashboard/components/inbox/InboxDateGroup.tsx (new)
/apps/project-dashboard/components/inbox/InboxPage.tsx
```

---

### [ ] Task 10: Bulk Actions

**Priority:** LOW  
**Effort:** 2 hours  
**Status:** NOT STARTED

**Description:** Allow users to select multiple notifications and perform bulk actions.

**Actions:**
- Mark as read/unread
- Delete
- Archive

**Subtasks:**

- [ ] Add checkbox to each notification item
- [ ] Add "Select all" checkbox
- [ ] Show bulk action toolbar when items selected
- [ ] Implement bulk mutations
- [ ] Add keyboard shortcut for select all (Cmd/Ctrl+A)
- [ ] Clear selection after bulk action

**Files to Modify:**
```
/apps/project-dashboard/components/inbox/InboxBulkActions.tsx (new)
/apps/project-dashboard/components/inbox/InboxPage.tsx
/apps/project-dashboard/lib/notifications/notifications-query.ts
```

---

### [ ] Task 11: Advanced Filters

**Priority:** LOW  
**Effort:** 1.5 hours  
**Status:** NOT STARTED

**Description:** Enhanced filtering beyond just notification type.

**Filters to Add:**
- Date range picker
- Source (project, task, habit, goal, etc.)
- Read/unread (replace tabs with filter)
- Priority (if implemented)

**Subtasks:**

- [ ] Extend `InboxFilterPopover` with new filters
- [ ] Add date range picker (use existing DatePicker)
- [ ] Add source multi-select
- [ ] Save filter presets (optional)
- [ ] Clear all filters button

**Files to Modify:**
```
/apps/project-dashboard/components/inbox/InboxFilterPopover.tsx
/apps/project-dashboard/components/inbox/InboxPage.tsx
/apps/api/src/notifications/dto/query-notification.dto.ts
```

---

### [ ] Task 12: Real-time Improvements

**Priority:** LOW  
**Effort:** 1.5 hours  
**Status:** NOT STARTED

**Description:** Improve WebSocket handling for better real-time experience.

**Subtasks:**

- [ ] Append new notifications instead of full refetch
- [ ] Handle `notification.updated` events
- [ ] Handle `notification.deleted` events
- [ ] Add debouncing for rapid updates (1 second)
- [ ] Show "New notification" toast with jump-to button
- [ ] Play subtle notification sound (with user preference toggle)

**Files to Modify:**
```
/apps/project-dashboard/hooks/use-notifications-socket.ts
/apps/project-dashboard/components/inbox/InboxPage.tsx
```

---

## Summary

| Phase | Task | Priority | Effort |
|-------|------|----------|--------|
| Phase 1 | Task 1: Delete Functionality | HIGH | 1h |
| Phase 1 | Task 2: URL Persistence | MEDIUM | 1h |
| Phase 1 | Task 3: Keyboard Navigation | MEDIUM | 1.5h |
| Phase 1 | Task 4: Optimistic Updates | MEDIUM | 0.5h |
| Phase 1 | Task 5: Pagination UI | MEDIUM | 1.5h |
| Phase 1 | Task 6: Extended Notification Types | MEDIUM | 2h |
| **Phase 1 Total** | | | **7.5h** |
| Phase 2 | Task 7: Archive Functionality | LOW | 2h |
| Phase 2 | Task 8: Search Inbox | LOW | 1.5h |
| Phase 2 | Task 9: Group by Date | LOW | 1h |
| Phase 2 | Task 10: Bulk Actions | LOW | 2h |
| Phase 2 | Task 11: Advanced Filters | LOW | 1.5h |
| Phase 2 | Task 12: Real-time Improvements | LOW | 1.5h |
| **Phase 2 Total** | | | **9.5h** |

**Grand Total:** 17 hours

---

## Recommended Execution Order

1. **Task 1** (Delete) - Quick win, uses existing backend
2. **Task 4** (Optimistic Updates) - Low effort, high impact
3. **Task 2** (URL Persistence) - Improves UX significantly
4. **Task 6** (Extended Types) - Foundation for future features
5. **Task 3** (Keyboard Navigation) - Accessibility requirement
6. **Task 5** (Pagination) - Needed for large notification volumes
7. **Task 7-12** (Phase 2) - Nice-to-have enhancements

---

## Notes

- Phase 1 should be completed before Phase 2
- Task 6 (Extended Types) requires backend changes - coordinate with backend team
- Task 7 (Archive) requires database migration
- Consider user preferences for notification sound (Task 12)
- All new features should have proper error handling and loading states
