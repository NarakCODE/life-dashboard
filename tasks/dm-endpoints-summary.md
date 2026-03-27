# DM Chat Endpoints Implementation

**Date:** March 26, 2026
**Status:** ✅ **COMPLETED**

---

## What Was Implemented

Added dedicated **Direct Message (DM) endpoints** for better chat UX:

1. **`GET /chat/dms`** - List all user's DM conversations
2. **`POST /chat/dms/:userId`** - Get or create DM with a specific user (idempotent)

---

## New Endpoints

### 1. GET /chat/dms

**Description:** Returns all DM channels for the current user with other user information.

**Response:**

```json
[
  {
    "id": "channel-123",
    "workspaceId": "workspace-456",
    "type": "dm",
    "otherUser": {
      "id": "user-789",
      "displayName": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "https://cloudinary.com/avatar.jpg"
    },
    "lastMessageId": "msg-abc",
    "lastMessageAt": "2026-03-26T10:00:00.000Z",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-03-26T10:00:00.000Z"
  }
]
```

**Use Case:** Display DM conversations list in sidebar

---

### 2. POST /chat/dms/:userId

**Description:** Get or create a DM channel with a specific user. This is **idempotent** - calling it multiple times returns the same channel.

**Parameters:**

- `userId` (path) - The user ID to create/get DM with

**Response (201 Created):**

```json
{
  "id": "channel-123",
  "workspaceId": "workspace-456",
  "type": "dm",
  "otherUser": {
    "id": "user-789",
    "displayName": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "https://cloudinary.com/avatar.jpg"
  },
  "lastMessageId": null,
  "lastMessageAt": null,
  "createdAt": "2026-03-26T10:00:00.000Z",
  "updatedAt": "2026-03-26T10:00:00.000Z"
}
```

**Error Responses:**

**403 Forbidden** - Cannot create DM with yourself:

```json
{
  "statusCode": 403,
  "message": "Cannot create DM with yourself",
  "error": "Forbidden"
}
```

**404 Not Found** - Target user doesn't exist:

```json
{
  "statusCode": 404,
  "message": "Target user not found",
  "error": "Not Found"
}
```

**Use Case:** Start conversation with a user from their profile

---

## Key Features

### ✅ Idempotent DM Creation

Calling `POST /chat/dms/:userId` multiple times returns the **same channel** - no duplicates created.

### ✅ Automatic User Validation

- Checks if target user exists before creating DM
- Prevents creating DM with yourself

### ✅ Other User Information Included

Each DM response includes complete user info:

- `id`, `displayName`, `email`, `avatarUrl`

### ✅ Sorted by Last Activity

DMs are sorted by `lastMessageAt` and `updatedAt` (most recent first)

---

## Files Created

| File                                               | Purpose                    |
| -------------------------------------------------- | -------------------------- |
| `apps/api/src/chat/dto/create-or-get-dm.dto.ts`    | DTO for DM creation        |
| `apps/api/src/chat/dto/dm-channel-response.dto.ts` | DM response with user info |

---

## Files Modified

| File                                             | Changes                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `apps/api/src/chat/services/channels.service.ts` | Added `findDms()`, `getOrCreateDm()`, `getOtherUserInDm()` methods |
| `apps/api/src/chat/chat.controller.ts`           | Added DM endpoints and `toDmChannelResponse()` transformer         |
| `apps/api/src/chat/dto/index.ts`                 | Exported new DTOs                                                  |
| `apps/api/src/chat/chat.module.ts`               | Added `UsersRepository` provider                                   |

---

## Testing

### List All DMs:

```bash
curl -X GET "http://localhost:3000/chat/dms" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-workspace-id: WORKSPACE_ID"
```

### Create/Get DM with User:

```bash
curl -X POST "http://localhost:3000/chat/dms/69bfe391d3d091c1feeb56e8" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-workspace-id: WORKSPACE_ID"
```

### Send DM Message (after creating channel):

```bash
curl -X POST "http://localhost:3000/chat/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-workspace-id: WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "CHANNEL_ID_FROM_DM_RESPONSE",
    "content": "Hello!"
  }'
```

### Get DM Messages:

```bash
curl -X GET "http://localhost:3000/chat/channels/CHANNEL_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-workspace-id: WORKSPACE_ID"
```

---

## Frontend Integration Example

### TypeScript Hook (TanStack Query):

```typescript
// lib/chat/dm-chat-query.ts
export function useDms(workspaceId: string) {
  return useQuery({
    queryKey: ["dms", workspaceId],
    queryFn: () => getDms(workspaceId),
  });
}

export function useGetOrCreateDm(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => getOrCreateDm(workspaceId, userId),
    onSuccess: (data) => {
      // Invalidate DMs list to refresh
      queryClient.invalidateQueries(["dms", workspaceId]);
    },
  });
}
```

### React Component:

```tsx
// Start DM conversation button
function StartConversationButton({ userId }: { userId: string }) {
  const { workspaceId } = useWorkspace();
  const getOrCreateDm = useGetOrCreateDm(workspaceId);
  const router = useRouter();

  const handleStartConversation = () => {
    getOrCreateDm.mutate(userId, {
      onSuccess: (dm) => {
        // Navigate to chat page with DM channel
        router.push(`/w/${workspaceId}/chat?channel=${dm.id}`);
      },
    });
  };

  return <button onClick={handleStartConversation}>Send Message</button>;
}
```

---

## Architecture Notes

### Service Layer Pattern

```
ChatController
    ↓
ChannelsService
    ↓
UsersRepository (for user validation)
```

### Idempotency Implementation

```typescript
// Check if DM exists before creating
const existingDm = await this.channelModel.findOne({
  workspaceId,
  type: ChannelType.DM,
  memberIds: { $all: [currentUserId, targetUserId] },
});

if (existingDm) {
  return existingDm; // Return existing instead of creating duplicate
}
```

---

## Swagger Documentation

Access at: `http://localhost:3000/api/docs`

New endpoints appear under:

- **Tag:** `chat`
- **Operations:**
  - `GET /chat/dms` - "Get all DM channels for the current user"
  - `POST /chat/dms/{userId}` - "Get or create a DM channel with a specific user"

---

## Comparison: Before vs After

| Feature         | Before                               | After                                     |
| --------------- | ------------------------------------ | ----------------------------------------- |
| Create DM       | ✅ Via generic `POST /chat/channels` | ✅ Via dedicated `POST /chat/dms/:userId` |
| List DMs        | ❌ Mixed with all channels           | ✅ Dedicated `GET /chat/dms`              |
| Idempotent      | ❌ Could create duplicates           | ✅ Always returns existing channel        |
| Other user info | ❌ Manual lookup required            | ✅ Included in response                   |
| User validation | ❌ Manual                            | ✅ Automatic                              |

---

## Build Status

✅ **Build:** Passing
✅ **TypeScript:** No errors
✅ **Swagger Docs:** Auto-updated

---

## Next Steps (Optional Enhancements)

1. **DM Search** - `GET /chat/dms/search?query=...` to find DM by user
2. **Archive DM** - Soft-delete or archive old DM conversations
3. **Block User** - Prevent DM creation with blocked users
4. **Typing Indicators** - Already exists in WebSocket, add DM-specific handling
5. **Read Receipts** - Show when DM messages are read

---

## Summary

✅ **Implementation Complete**

The chat API now has dedicated DM endpoints with:

- ✅ Idempotent DM creation (no duplicates)
- ✅ Automatic user validation
- ✅ Other user info included in responses
- ✅ Proper error handling
- ✅ Full Swagger documentation
- ✅ Build passing

**Ready for frontend integration!**
