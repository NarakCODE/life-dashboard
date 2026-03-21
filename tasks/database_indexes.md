# Database Indexing Strategy

This document outlines the indexing strategy for the Life Dashboard database.
Indexes are crucial for read performance and query scalability.

## General Principles

1.  **Single Field Indexes**: Used for simple equality matches.
2.  **Compound Indexes**: Essential for queries that match multiple fields, or when queries filter on one field and sort by another.
3.  **Unique Indexes**: Enforce data integrity (e.g., unique email addresses).
4.  **Sparse Indexes**: Useful for fields that are frequently omitted from documents to save index space.
5.  **TTL Indexes**: Automatically delete documents after a certain period (e.g., OTP codes).

## Current and Planned Indexes

### Collections

#### 1. Users Collection (`users`)

-   **`{ email: 1 }` (Unique)**:
    -   *Purpose*: Enforce email uniqueness during registration and allow fast lookup by email during login.
    -   *Status*: Implemented in `User` schema.
-   **`{ refreshTokenHash: 1 }` (Sparse)**:
    -   *Purpose*: Find user by token efficiently if searching. Currently, tokens are validated against `userId`, so this might not be necessary unless we search across the whole DB for a compromised token. (Low Priority)

#### 2. OTP Codes Collection (`otp_codes`)

-   **`{ userId: 1, type: 1 }`**:
    -   *Purpose*: Fast lookup for a user's specific OTP type to validate.
    -   *Status*: Needs to be ensured in schema.
-   **`{ expiresAt: 1 }` (TTL Index)**:
    -   *Purpose*: Automatically remove expired codes.
    -   *Status*: Should be implemented as `@Prop({ expires: 0 })` on `expiresAt`.

#### 3. Tasks Collection (`tasks`)

-   **`{ userId: 1, status: 1 }` (Compound)**:
    -   *Purpose*: Fetching user tasks filtered by status (e.g., "Pending", "Completed").
-   **`{ userId: 1, dueDate: 1 }` (Compound)**:
    -   *Purpose*: Fetching tasks due today, tomorrow, or overdue, sorted by date.

#### 4. Transactions / Budgets Collection (`transactions`)

-   **`{ userId: 1, date: -1 }` (Compound)**:
    -   *Purpose*: Fetching transaction history for a specific user, sorted newest first.
-   **`{ userId: 1, categoryId: 1 }` (Compound)**:
    -   *Purpose*: Aggregating transactions for budget tracking and charts.

#### 5. Journal Entries Collection (`journal_entries`)

-   **`{ userId: 1, date: -1 }` (Compound)**:
    -   *Purpose*: Fetching timeline of entries, sorted by newest.

## Recommendations

1.  Use `class-validator` and `mongoose` decorators appropriately.
    -   Example: `@Prop({ index: true })` for simple indexes.
    -   Example: `Schema({ ... })` decorator options or `.index()` explicitly for compound indexes.
2.  Be mindful of the "ESR Rule" (Equality, Sort, Range) when creating compound indexes. Ensure the keys are in the correct order to maximize index usage.
3.  Periodically review the query patterns using MongoDB Profiler and `.explain("executionStats")` to verify that indexes are being utilized effectively.
