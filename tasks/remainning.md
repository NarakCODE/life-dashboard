### Module Dependencies

- `habit-logs` → depends on `habits` (habitId references)
- `transactions` → independent, links to budgets via category

---

## Plan: HabitLogsModule Implementation

### Phase 1: DTOs and Types

- [ ] Create `QueryHabitLogDto` (extend PaginationQueryDto, filter by habitId, date range)
- [ ] Create `UpdateHabitLogDto` (partial update for notes/completion status)
- [ ] Create `HabitLogResponseDto` (serialization with habit details)
- [ ] Create DTO index export file

### Phase 2: Repository Layer Enhancements

- [ ] Add `findByIdAndUser(id, userId)` - verify ownership via habit lookup
- [ ] Add `findByHabitId(habitId, userId, query)` - list logs for a specific habit
- [ ] Add `findByUserId(userId, query)` - list all logs for user
- [ ] Add `findByDateRange(userId, startDate, endDate)` - for streak calculations
- [ ] Add `updateById(id, updateData)` - update log notes/completion
- [ ] Add `deleteByIdAndUser(id, userId)` - delete a log entry
- [ ] Add `countByHabitAndDateRange(habitId, start, end)` - for analytics

### Phase 3: Service Layer Implementation

- [ ] Implement `create(userId, dto)` - validate habit exists and belongs to user
- [ ] Implement `findByIdAndUser(id, userId)` - get single log with ownership check
- [ ] Implement `findByHabitId(habitId, userId, query)` - paginated habit logs
- [ ] Implement `findByUserId(userId, query)` - all user logs with pagination
- [ ] Implement `update(id, userId, dto)` - update log entry
- [ ] Implement `delete(id, userId)` - delete log entry
- [ ] Add business rule: prevent duplicate logs for same habit+date

### Phase 4: Controller Layer

- [ ] Create `HabitLogsController`
- [ ] `POST /habit-logs` - create log
- [ ] `GET /habit-logs` - list user's logs
- [ ] `GET /habit-logs/habit/:habitId` - list logs for specific habit
- [ ] `GET /habit-logs/:id` - get single log
- [ ] `PATCH /habit-logs/:id` - update log
- [ ] `DELETE /habit-logs/:id` - delete log
- [ ] Add Swagger decorators and guards

### Phase 5: Module Integration

- [ ] Update `HabitLogsModule` exports
- [ ] Import `HabitsModule` for cross-module validation

---

## Plan: TransactionsModule Implementation

### Phase 1: DTOs and Types

- [ ] Create `QueryTransactionDto` (extend PaginationQueryDto, filter by type, category, date range)
- [ ] Create `UpdateTransactionDto` (partial update)
- [ ] Create `TransactionResponseDto` (serialization)
- [ ] Create DTO index export file

### Phase 2: Repository Layer Enhancements

- [ ] Add `findByIdAndUser(id, userId)` - scoped access
- [ ] Add `findWithPaginationAndFilters(userId, query)` - advanced querying
- [ ] Add `findByBudgetCategory(userId, category, query)` - filter by budget category
- [ ] Add `getSummaryByDateRange(userId, start, end)` - income/expense totals
- [ ] Add `updateByIdAndUser(id, userId, updateData)` - update transaction
- [ ] Add `deleteByIdAndUser(id, userId)` - delete transaction

### Phase 3: Service Layer Implementation

- [ ] Implement `create(userId, dto)` - create transaction
- [ ] Implement `findByIdAndUser(id, userId)` - get single transaction
- [ ] Implement `findMany(userId, query)` - list with filters
- [ ] Implement `update(id, userId, dto)` - update transaction
- [ ] Implement `delete(id, userId)` - delete transaction
- [ ] Implement `getSummary(userId, dateRange)` - financial summary

### Phase 4: Controller Layer

- [ ] Create `TransactionsController`
- [ ] `POST /transactions` - create
- [ ] `GET /transactions` - list with filters
- [ ] `GET /transactions/summary` - financial summary
- [ ] `GET /transactions/:id` - get single
- [ ] `PATCH /transactions/:id` - update
- [ ] `DELETE /transactions/:id` - delete
- [ ] Add Swagger decorators and guards

### Phase 5: Module Integration

- [ ] Update `TransactionsModule` exports

---

## Verification Checklist

### Build & Quality

- [ ] TypeScript build passes (`tsc --noEmit`)
- [ ] All endpoints documented in Swagger
- [ ] Consistent response formats (success/error)

### Security

- [ ] All endpoints use `@UseGuards(JwtAuthGuard)`
- [ ] All queries scoped by `userId`
- [ ] No user can access another user's data

### API Completeness

- [ ] HabitLogs: Full CRUD + habit-scoped queries
- [ ] Transactions: Full CRUD + summary endpoint

---

## Results (To be filled after completion)

- Build: [pending]
- API Coverage: [pending]%
- Swagger Documentation: [pending]
