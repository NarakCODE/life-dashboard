# Registration & OTP Verification Flow — UX Design Document

**Product**: PM Tools  
**Scope**: Authentication (Registration → Email Verification)  
**Target**: Fintech/SaaS Quality Standard  
**Platform**: Web (Responsive: Mobile → Desktop)

---

## A. High-Level User Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Landing or    │────▶│   Registration  │────▶│  OTP Sending    │
│   Login Screen  │     │     Screen      │     │   (Processing)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Success State  │◀────│   OTP Input     │◀────│  Email Sent     │
│  (Auto-redirect)│     │    Screen       │     │  Confirmation   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Login Screen   │
│  (with success  │
│   messaging)    │
└─────────────────┘
```

**Error Flows (Parallel)**:
- Validation errors → Inline on registration screen
- Wrong OTP → Inline on OTP screen with shake animation
- Expired OTP → Error message + "Resend code" CTA
- Too many attempts → Rate limit screen with countdown
- Email already exists → Inline error + "Sign in" link

---

## B. Screen-by-Screen Breakdown

---

### Screen 1: Registration

**Screen Name**: Create Account  
**Purpose**: Collect user credentials and initiate verification  
**URL**: `/register`

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Logo]  PM Tools                       │
│  Create your account                    │
│  Join thousands of teams shipping       │
│  better projects.                       │
├─────────────────────────────────────────┤
│                                         │
│  Full Name *                            │
│  ┌─────────────────────────────────┐   │
│  │ John Doe                         │   │
│  └─────────────────────────────────┘   │
│  ▲ Name must be at least 2 characters   │
│                                         │
│  Email Address *                        │
│  ┌─────────────────────────────────┐   │
│  │ john@company.com                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Password *                             │
│  ┌─────────────────────────────────┐   │
│  │ ••••••••••••   [👁️]            │   │
│  └─────────────────────────────────┘   │
│  [████████░░░░░░░░░░░░] Medium        │
│  ▲ Must contain at least 8 characters   │
│    with 1 number and 1 special char     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🛡️ Your data is encrypted and   │   │
│  │    never shared.                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Spinner] Creating account...  │   │
│  └─────────────────────────────────┘   │
│       ── OR ──                          │
│  ┌─────────────────────────────────┐   │
│  │  Create account                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Already have an account? Sign in       │
│                                         │
└─────────────────────────────────────────┘
```

#### UI Components

| Component | Type | Behavior |
|-----------|------|----------|
| Full Name | Text input | Auto-focus on load, auto-complete="name", validates on blur |
| Email | Email input | Auto-complete="email", validates format on blur, checks availability debounced (500ms) |
| Password | Password input | Toggle visibility, strength meter, validates on input |
| Submit | Primary button | Full width, disabled until all fields valid, shows spinner when loading |
| Trust Badge | Info banner | Lock icon, reassurance message about encryption |
| Footer Link | Text link | Navigates to login |

#### Validation States

**Inline Validation (Real-time)**:

| Field | Rule | Error Message |
|-------|------|---------------|
| Full Name | Required | "Please enter your full name" |
| Full Name | Min 2 chars | "Name must be at least 2 characters" |
| Email | Required | "Email address is required" |
| Email | Valid format | "Please enter a valid email address" |
| Email | Domain check | "Please use a valid company email" |
| Email | Already exists | "This email is already registered. Sign in instead" (link) |
| Password | Required | "Please create a password" |
| Password | Min 8 chars | "Password must be at least 8 characters" |
| Password | Complexity | "Include at least 1 number and 1 special character" |

**Password Strength Indicator**:
- Weak (< 8 chars): Red — "Too short"
- Fair (8+ chars, no complexity): Orange — "Add numbers & symbols"
- Good (8+ chars, 2 criteria): Blue — "Good password"
- Strong (12+ chars, all criteria): Green — "Strong password"

#### Loading State
- Button text changes to: "Creating account..."
- Spinner icon replaces button text
- All inputs disabled with `opacity-50`
- Cursor shows `not-allowed` on disabled elements

#### Disabled State Rules
- Button disabled until: All fields touched AND all validations pass
- Visual: `opacity-50`, cursor `not-allowed`

---

### Screen 2: OTP Sending (Processing)

**Screen Name**: Sending Verification  
**Purpose**: Bridge state while email is being sent  
**URL**: `/verify-email?email=john@company.com&sending=true`  
**Duration**: 1-3 seconds (optimistic), up to 10 seconds max

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Logo]  PM Tools                       │
│  Sending verification...                │
│                                         │
│         ┌─────────┐                     │
│         │  ⟳  75% │   ← Animated        │
│         └─────────┘     progress ring   │
│                                         │
│  Sending a secure 6-digit code to:      │
│  john@company.com                       │
│                                         │
│  [Edit email address]                   │
│                                         │
└─────────────────────────────────────────┘
```

#### UI Components

| Component | Type | Behavior |
|-----------|------|----------|
| Progress Ring | Animated SVG | Spins continuously, shows indeterminate progress |
| Email Display | Read-only text | Masked if long: "j***@company.com" |
| Edit Link | Text button | Returns to registration with pre-filled data |

#### Accessibility
- `aria-live="polite"` on status message
- `aria-busy="true"` on container
- Screen reader announces: "Sending verification email to john at company dot com"

---

### Screen 3: OTP Input

**Screen Name**: Verify Your Email  
**Purpose**: Collect and verify 6-digit code  
**URL**: `/verify-email?email=john@company.com`

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Logo]  PM Tools                       │
│  Verify your email                      │
│  Enter the 6-digit code we sent to:     │
│  john@company.com [Change]              │
├─────────────────────────────────────────┤
│                                         │
│  Verification Code *                    │
│  ┌────┬────┬────┬────┬────┬────┐       │
│  │ 4  │ 2  │ 9  │ 8  │ 3  │ 7  │       │
│  └────┴────┴────┴────┴────┴────┘       │
│                                         │
│  [Didn't receive it? Check spam or]    │
│  [resend in 00:45]                      │
│                                         │
│  ▲ Invalid code. Please try again.      │
│     2 attempts remaining.               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Verify Email               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Back to login]                        │
│                                         │
└─────────────────────────────────────────┘
```

#### UI Components

| Component | Type | Behavior |
|-----------|------|----------|
| OTP Input | 6 individual boxes | Auto-focus first, auto-advance on input, backspace moves back, paste fills all |
| Resend Timer | Countdown text | Shows remaining time, updates every second |
| Resend Button | Text button | Enabled when timer reaches 0 |
| Verify Button | Primary button | Full width, disabled until 6 digits entered |
| Change Email | Link | Returns to registration with pre-filled data |

#### OTP Input Behavior

**Auto-advance Logic**:
1. User types digit in box 1 → focus moves to box 2
2. User types digit in box 6 → auto-submit after 200ms debounce
3. User presses Backspace in empty box → focus moves to previous box
4. User pastes "429837" → fills all 6 boxes, auto-submit

**Visual States per Box**:
- Empty: `border-input bg-background`
- Filled: `border-primary bg-background`
- Focused: `border-primary ring-2 ring-primary/20`
- Error (shake): `border-destructive` + horizontal shake animation

#### Validation States

| State | Trigger | Message | Action |
|-------|---------|---------|--------|
| Empty | Form submit attempted | "Please enter the 6-digit code" | Focus first box |
| Wrong OTP | API 400 response | "Invalid code. Please try again. X attempts remaining." | Shake animation, clear inputs, focus first box |
| Expired OTP | API 400 response | "This code has expired. We've sent a new one." | Auto-resend, show new timer |
| Too many attempts | API 429 response | "Too many attempts. Please try again in 5 minutes." | Show rate limit screen |
| Success | API 200 response | "Email verified successfully!" | Show success screen |

#### Countdown Timer

**Initial Delay**: 60 seconds  
**Format**: "Resend code in 00:45" → counts down to "Resend code"

**Timer States**:
- Counting: Text in muted color, non-clickable
- Ready: Blue link text, clickable
- Clicked: "Sending..." with spinner for 2 seconds

---

### Screen 4: Rate Limit / Too Many Attempts

**Screen Name**: Please Wait  
**Purpose**: Prevent abuse, manage user frustration  
**URL**: `/verify-email?email=john@company.com&rateLimited=true`

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Logo]  PM Tools                       │
│  Please wait                            │
│                                         │
│           ⚠️                            │
│                                         │
│  Too many verification attempts         │
│                                         │
│  For your security, we've temporarily   │
│  limited verification attempts.         │
│                                         │
│  You can try again in:                  │
│         ┌─────────┐                     │
│         │  04:32  │  ← Large countdown  │
│         └─────────┘                     │
│                                         │
│  Need help? Contact support             │
│                                         │
│  [Back to login]                        │
│                                         │
└─────────────────────────────────────────┘
```

#### UI Components

| Component | Type | Behavior |
|-----------|------|----------|
| Warning Icon | Large icon | Yellow/amber warning symbol |
| Countdown | Large timer | MM:SS format, updates every second |
| Support Link | Text link | Opens help/support (mailto or chat) |
| Back Button | Outline button | Returns to login |

---

### Screen 5: Success State

**Screen Name**: Email Verified  
**Purpose**: Confirm verification, guide to login  
**URL**: `/verify-email?email=john@company.com&verified=true`

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Logo]  PM Tools                       │
│  Email verified!                        │
│                                         │
│           ✓                             │
│         ┌───┐                           │
│         │ ✓ │  ← Animated checkmark     │
│         └───┘    (draws on load)        │
│                                         │
│  Your email has been verified.          │
│  You're all set to start using          │
│  PM Tools.                              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Continue to login          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Redirecting automatically in 5...      │
│                                         │
└─────────────────────────────────────────┘
```

#### UI Components

| Component | Type | Behavior |
|-----------|------|----------|
| Checkmark | Animated SVG | Draws stroke on mount (0.5s animation) |
| Continue Button | Primary button | Navigates to login |
| Auto-redirect | Countdown text | "Redirecting automatically in 5... 4..." |

#### Auto-redirect Behavior
- Countdown from 5 seconds
- Button shows "Continue to login" (immediate navigation)
- At 0: automatically navigates to `/login?verified=true`
- Clear countdown if user clicks button manually

---

## C. UX Microcopy Examples

### Button Labels

| State | Label | Rationale |
|-------|-------|-----------|
| Default | "Create account" | Clear action, professional |
| Loading | "Creating account..." | Indicates ongoing process |
| Disabled | "Create account" | No change, visual state communicates |
| OTP Default | "Verify email" | Direct action |
| OTP Loading | "Verifying..." | Shorter for constrained space |
| Resend Timer | "Resend code in 00:45" | Clear expectation setting |
| Resend Ready | "Resend code" | Action-oriented |
| Resend Loading | "Sending..." | Brief feedback |

### Error Messages

| Scenario | Message | Tone |
|----------|---------|------|
| Email exists | "This email is already registered. Sign in instead" | Helpful, provides solution |
| Invalid email | "Please enter a valid email address" | Clear, actionable |
| Weak password | "Password must be at least 8 characters with 1 number and 1 symbol" | Specific guidance |
| Wrong OTP | "Invalid code. 2 attempts remaining" | Informative, sets expectation |
| Expired OTP | "This code has expired. We've sent a new one to your email" | Proactive solution |
| Rate limited | "Too many attempts. Please try again in 4 minutes" | Clear timeline |
| Network error | "Connection issue. Please check your internet and try again" | Not user's fault |

### Helper Text

| Location | Text | Purpose |
|----------|------|---------|
| Password field | "Use 8+ characters with a mix of letters, numbers & symbols" | Guidance before error |
| Email field | "We'll send a verification code to this address" | Sets expectation |
| OTP screen | "Didn't receive it? Check your spam folder or resend the code" | Reduces support tickets |

### Trust & Security Messaging

| Location | Text |
|----------|------|
| Registration card footer | "🔒 Your data is encrypted and stored securely. We never share your information." |
| OTP screen | "🔒 For your security, verification codes expire after 10 minutes." |
| Success screen | "✓ Your account is now secure and ready to use." |

---

## D. Key UX Decisions & Rationale

### 1. Single OTP Input vs. 6 Separate Boxes

**Decision**: 6 individual input boxes  
**Rationale**:
- Clear visual expectation of 6 digits
- Easier to scan and verify entry
- Mobile-friendly (larger touch targets)
- Supports paste from email/app
- Industry standard (Apple, Google, banking apps)

### 2. Auto-submit on Complete

**Decision**: Auto-submit when 6th digit entered  
**Rationale**:
- Reduces friction (no extra click)
- 200ms debounce allows for correction if mistyped
- Common expectation in modern auth flows

### 3. Edit Email from OTP Screen

**Decision**: Allow email change from OTP screen  
**Rationale**:
- Common error: user typo in email
- Prevents user from being stuck
- Preserves form data when navigating back
- Reduces abandonment

### 4. Countdown Timer for Resend

**Decision**: 60-second countdown before resend  
**Rationale**:
- Prevents spam/abuse
- Industry standard (30-120 seconds)
- Visual countdown reduces anxiety vs. disabled button
- Long enough for email delivery, short enough for patience

### 5. Progressive Disclosure of Errors

**Decision**: Inline validation + contextual help  
**Rationale**:
- Real-time feedback prevents form submission errors
- Specific error messages reduce cognitive load
- Links to solutions (e.g., "Sign in instead") reduce friction

### 6. Auto-redirect on Success

**Decision**: 5-second auto-redirect with manual override  
**Rationale**:
- Users expect to go to login after verification
- Manual button provides control
- Countdown creates urgency but doesn't rush

### 7. Password Strength Meter

**Decision**: Visual bar + text guidance  
**Rationale**:
- Visual feedback is processed faster than reading
- Specific guidance ("Add numbers") helps users improve
- Green checkmark provides positive reinforcement

### 8. Masked Email Display

**Decision**: Show full email with mask option for long addresses  
**Rationale**:
- User needs to verify correct email
- Privacy consideration in public spaces
- Pattern: j***@company.com for long emails

---

## E. Edge Cases & Handling

### User Navigates Away and Returns

**Scenario**: User closes tab after registration, returns later  
**Handling**:
- URL contains email: `/verify-email?email=john@company.com`
- On load: Check if email is already verified → redirect to login with success message
- If not verified: Show OTP screen with option to resend
- Store email in sessionStorage as backup (cleared on success)

### OTP Arrives Late

**Scenario**: User requests new OTP while first one is in transit  
**Handling**:
- Both codes work (backend supports multiple valid codes within time window)
- Latest code displayed prominently in email
- UI shows: "We've sent a new code. Either code will work."

### User Requests Multiple Resends

**Scenario**: User clicks resend 3+ times  
**Handling**:
- Backend rate limit: max 3 resends per 10 minutes
- UI shows: "Maximum resends reached. Please check your spam folder or try again in X minutes."
- Provide "Contact support" option

### User Edits Email Mid-Process

**Scenario**: User on OTP screen clicks "Change email"  
**Handling**:
- Navigate to `/register?email=john@company.com&edit=true`
- Pre-fill form with existing data
- Clear any previously sent OTPs for old email
- On new submission: Send new OTP to new email

### Browser Autofill

**Decision**: Support autofill completely  
**Implementation**:
- `autoComplete="name"` on full name
- `autoComplete="email"` on email
- `autoComplete="new-password"` on password
- Password managers can fill all fields

### Mobile Keyboard Optimization

**OTP Input**:
- `inputMode="numeric"` for numeric keyboard
- `autoComplete="one-time-code"` for iOS SMS autofill
- Auto-focus first box on screen load

---

## F. Accessibility Considerations

### Keyboard Navigation
- Tab order: Name → Email → Password → Submit → Footer links
- OTP boxes: Arrow keys navigate between boxes
- Enter key submits form when focus on any input
- Escape key on modals (if any)

### Screen Reader Support
- All inputs have associated labels
- Error announcements use `aria-live="polite"`
- Loading states announce "Creating account, please wait"
- Success states announce "Email verified successfully"
- OTP input: "Verification code, 6 digits required"

### Visual Accessibility
- Minimum 4.5:1 contrast ratio for all text
- Error states use color + icon + text (not just color)
- Focus indicators clearly visible
- Touch targets minimum 44x44px on mobile

### Motion Preferences
- Respect `prefers-reduced-motion`:
  - Disable shake animation
  - Instant transitions instead of sliding
  - Static checkmark instead of drawing animation

---

## G. Responsive Behavior

### Mobile (< 640px)
- Full-width card with 16px padding
- Stacked buttons (verify / resend)
- OTP boxes: 40px width each
- Larger touch targets (48px minimum)
- Keyboard-aware layout (scrolls to keep inputs visible)

### Tablet (640px - 1024px)
- Card max-width: 420px
- Centered with generous padding
- OTP boxes: 48px width each
- Side-by-side buttons where space allows

### Desktop (> 1024px)
- Card max-width: 440px
- Background image visible
- Subtle shadow and depth
- OTP boxes: 56px width each
- Hover states on buttons

---

## H. Analytics & Tracking

**Events to Track**:
- `registration_started` — User lands on register page
- `registration_step_completed` — User submits registration form (success)
- `registration_failed` — User submits with validation/server error
- `otp_screen_viewed` — User lands on OTP screen
- `otp_submitted` — User submits OTP
- `otp_verified` — OTP verification successful
- `otp_failed` — OTP verification failed (with reason)
- `otp_resent` — User requests new OTP
- `resend_rate_limited` — User hits resend limit
- `email_changed_mid_flow` — User edits email from OTP screen
- `verification_success` — User completes full flow

**Properties to Include**:
- Time spent on each screen
- Number of OTP attempts
- Number of resend requests
- Password strength score
- Error types encountered

---

## Summary

This registration and OTP flow prioritizes:

1. **Clarity**: Every action has clear feedback
2. **Efficiency**: Minimal steps, auto-advance, smart defaults
3. **Trust**: Security messaging, transparent processes
4. **Resilience**: Handles errors gracefully, provides escape hatches
5. **Accessibility**: Works for all users, all devices, all abilities

The design follows fintech-grade security while maintaining SaaS-level usability, ensuring users can complete registration quickly and confidently.
