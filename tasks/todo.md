# Dashboard Module Implementation Plan

## Status: ✅ COMPLETE

## Core Features and Steps

### 1. Tasks Repository Aggregation
- [x] Add `getTaskOverview(userId: string)` in `tasks.repository.ts`.
  - Aggregation pipeline for:
    - total tasks
    - counts by status
    - overdue tasks count
    - upcoming tasks count
    - completed tasks summary

### 2. Tasks Service Integration
- [x] Add `getTaskOverview(userId: string)` in `tasks.service.ts`

### 3. Dashboard Module Setup
- [x] Create `DashboardModule` (`apps/api/src/dashboard/dashboard.module.ts`)
  - Import `TasksModule`
- [x] Create `DashboardController` (`apps/api/src/dashboard/dashboard.controller.ts`)
  - Endpoint: `GET /dashboard/tasks-overview`
- [x] Inject into `app.module.ts`

## Core Features and Steps

### 1. DTO Generation
- [ ] Create `CreateTaskDto`
- [ ] Create `UpdateTaskDto`
- [ ] Create `QueryTaskDto` (extending `PaginationQueryDto`, adding filters)
- [ ] Create `TaskResponseDto` (serialization rules)

### 2. Repository Layer
- [ ] Update `TasksRepository` to implement:
  - `createTask`
  - `findByIdAndUser` (strictly enforced `userId` checks)
  - `findWithPaginationAndFilters` (advanced querying)
  - `updateByIdAndUser`
  - `deleteByIdAndUser`

### 3. Service Layer
- [ ] Update `TasksService`
  - Business rules, mapping to DTOs, exception handling (NotFoundException when a task belongs to another user or doesn't exist).

### 4. Controller Layer
- [ ] Create `TasksController`
  - Integrate `@UseGuards(JwtAuthGuard)`
  - Inject `@CurrentUser('sub') userId: string`
  - Endpoints: `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`
  - Apply Swagger decorators (`@ApiTags`, API responses)

### 5. Module Setup
- [ ] Add Controller and Providers to `TasksModule`

---

# Past Tasks: Core Backend Infrastructure

## Status: ✅ COMPLETE

## Core Features to Build

### Request & Validation Layer
- [x] Environment variable validation (fail fast on invalid config)
- [x] Base pagination query DTO (page, limit, sorting, filtering)
- [x] Verify Global validation pipe configuration

### Error Handling & Responses
- [x] Global exception filter (update to consistent `success`, `statusCode`, `message`, `errors` format)
- [x] Global response interceptor (verify standard success responses format)

### Developer Experience Enhancements
- [x] Custom `@CurrentUser()` decorator
- [x] Centralized config validation setup
- [x] Swagger API documentation improvements (grouped endpoints, examples)

### Database Optimization
- [x] Review and define database indexes for performance and scalability

## Results
- Enforced centralized schema validation for missing environment variables
- Consistent success (wrapping data in object) and error responses across all Nest controllers
- Optimized database indexing strategy documented.
- Developed the foundational pagination DTO.

---

# Past Tasks: Auth Module — Full Implementation Plan

## Status: ✅ COMPLETE

## Gap Analysis (What already exists vs. what's needed)

### ✅ Already Done
- `User` schema (basic: email, passwordHash, displayName, refreshTokenHash)
- `UsersRepository` + `UsersService`
- `AuthService` (register, login, refresh, logout, getMe) — no email verification
- `AuthController` (all endpoints) — no verification endpoint
- `AuthModule` with global `JwtAuthGuard`
- `JwtStrategy` + `JwtRefreshStrategy`
- `DTOs`: RegisterDto, LoginDto, AuthTokensDto
- `OtpCode` schema + empty repository/service stubs
- Global validation pipe, exception filter, transform interceptor, Swagger

### ✅ Implemented in This Session
1. `User` schema: added `isEmailVerified: boolean` (default false)
2. `OtpType` enum: added `EMAIL_VERIFY`
3. `OtpCodesRepository`: fully implemented (create, findValidCode, markAsUsed, deleteByUserAndType, countRecentlyCreated)
4. `OtpCodesService`: fully implemented (generate with rate limit, validate with replay protection)
5. `EmailModule` + `BrevoEmailService`: Brevo REST API via @nestjs/axios, fire-and-forget
6. `email.config.ts`: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, APP_URL
7. `UsersRepository.markEmailVerified()`: patches isEmailVerified=true
8. `UsersService.markEmailVerified()`: delegation
9. `AuthService`: wired email-verify flow into register/login, added verifyEmailByEmail, resendVerification
10. `VerifyEmailDto`, `ResendVerificationDto`: new DTOs
11. `AuthController`: added POST /auth/verify-email, POST /auth/resend-verification
12. `AuthModule`: imported OtpCodesModule + EmailModule
13. `app.module.ts`: emailConfig added to global ConfigModule.forRoot load[]
14. `main.ts`: refresh-token bearer auth scheme added to Swagger
15. `UserResponseDto`: added isEmailVerified field
16. TypeScript build: ✅ clean (tsc --noEmit)

## Tasks

- [x] Step 1: Install @nestjs/axios, axios
- [x] Step 2: Update OtpType enum → add EMAIL_VERIFY
- [x] Step 3: Implement OtpCodesRepository fully
- [x] Step 4: Implement OtpCodesService fully
- [x] Step 5: Create EmailModule with BrevoEmailService
- [x] Step 6: Add email.config.ts
- [x] Step 7: Update User schema → add isEmailVerified
- [x] Step 8: Update UsersRepository → add markEmailVerified()
- [x] Step 9: Update AuthService → wire email-verify flow
- [x] Step 10: Add DTOs: VerifyEmailDto, ResendVerificationDto
- [x] Step 11: Update AuthController → add /verify-email + /resend-verification
- [x] Step 12: Update OtpCodesModule; update AuthModule imports
- [x] Step 13: Update app.module.ts → emailConfig in load[]
- [x] Step 14: Update main.ts → refresh-token bearer auth in Swagger
- [x] Step 15: TypeScript build verification — PASSED
- [x] Step 16: Write architecture document artifact

## Results
- Build: ✅ clean
- All endpoints implemented and documented in Swagger
- Security: OTP hashed (SHA-256), refresh tokens hashed (bcrypt), replay prevention, rate limiting
