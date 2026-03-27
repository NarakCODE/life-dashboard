# Fix: GET /users/:id ObjectId Validation

**Date:** March 26, 2026  
**Issue:** Endpoint was rejecting valid MongoDB ObjectIds  
**Status:** ✅ **FIXED**

---

## Problem

The `GET /users/:id` endpoint was using `ParseUUIDPipe` which expects UUID format:
- UUID: `550e8400-e29b-41d4-a716-446655440000` (with hyphens)

But MongoDB uses ObjectId format:
- ObjectId: `69bfe391d3d091c1feeb56e8` (24 hex characters, no hyphens)

### Error Response (Before Fix):
```json
{
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Solution

Changed from `ParseUUIDPipe` to `ParseObjectIdPipe` (already available in the codebase).

### File Changed: `users.controller.ts`

**Before:**
```typescript
import { ParseUUIDPipe } from '@nestjs/common';

@Get(':id')
async getUserById(
  @Param('id', ParseUUIDPipe) id: string,
): Promise<UserPublicDto> {
  // ...
}
```

**After:**
```typescript
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Get(':id')
async getUserById(
  @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
): Promise<UserPublicDto> {
  // ...
}
```

---

## Testing

### Test with Valid ObjectId:
```bash
curl -X GET "http://localhost:3000/users/69bfe391d3d091c1feeb56e8" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Expected Success Response (200 OK):
```json
{
  "id": "69bfe391d3d091c1feeb56e8",
  "email": "user@example.com",
  "displayName": "John Doe",
  "roles": ["member"],
  "isEmailVerified": true,
  "status": "active",
  "avatarUrl": "https://...",
  "profileMetadata": {},
  "lastLogin": "2026-03-26T10:00:00.000Z",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-03-26T10:00:00.000Z"
}
```

### Expected Error for Invalid ObjectId (400 Bad Request):
```json
{
  "message": "Invalid ObjectId: invalid-id",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Expected Error for Non-existent User (404 Not Found):
```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## Build Status

✅ **Build:** Passing  
✅ **TypeScript:** No errors  

---

## Related Files

| File | Change |
|------|--------|
| `apps/api/src/users/users.controller.ts` | Changed ParseUUIDPipe → ParseObjectIdPipe |

---

## Summary

✅ **Issue Resolved**

The endpoint now correctly accepts MongoDB ObjectIds. You can test it with your user ID:

```
GET /users/69bfe391d3d091c1feeb56e8
```

This should now return the user details instead of the validation error.
