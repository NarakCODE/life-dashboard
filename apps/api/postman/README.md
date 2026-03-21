# Postman Collections for Life Dashboard API

This directory contains Postman collections and environments for testing the Life Dashboard API.

## 📁 Structure

```
postman/
├── collections/           # API endpoint collections
│   ├── 01-auth.json      # Authentication (register, login, verify)
│   ├── 02-tasks.json     # Task management
│   ├── 03-habits.json    # Habit tracking
│   ├── 04-habit-logs.json # Habit completion logs
│   ├── 05-goals.json     # Goal setting
│   ├── 06-budgets.json   # Budget planning
│   ├── 07-transactions.json # Transaction tracking
│   ├── 08-journal-entries.json # Journaling
│   ├── 09-notifications.json # In-app notifications
│   └── 10-dashboard.json # Dashboard stats
├── environments/
│   └── life-dashboard-local.json # Local environment variables
└── README.md
```

## 🚀 Quick Start

### 1. Import Collections

1. Open Postman
2. Click **Import** button
3. Select all files from `collections/` folder
4. Import the environment from `environments/life-dashboard-local.json`

### 2. Configure Environment

Select the **"Life Dashboard - Local"** environment from the dropdown.

Default variables:
- `baseUrl`: `http://localhost:3000`
- `accessToken`: Auto-populated after login
- `refreshToken`: Auto-populated after login

### 3. Authentication Flow

Run the requests in this order:

1. **Register** (`01-auth` → `Register`)
   - Creates a new user account
   
2. **Login** (`01-auth` → `Login`)
   - Automatically saves `accessToken` and `refreshToken` to environment
   - Automatically saves `userId` from `/me` response

3. **Get Me** (`01-auth` → `Get Me`)
   - Verifies authentication and loads user info

### 4. Test Other Endpoints

Once authenticated, you can use any collection:
- Create tasks, habits, budgets
- Log habit completions
- Track transactions
- Write journal entries

## 🔑 Environment Variables

| Variable | Description | Auto-set |
|----------|-------------|----------|
| `baseUrl` | API base URL | Manual |
| `accessToken` | JWT access token | ✅ Login |
| `refreshToken` | JWT refresh token | ✅ Login |
| `userId` | Current user ID | ✅ Get Me |
| `taskId` | Last created task | ✅ Create Task |
| `habitId` | Last created habit | ✅ Create Habit |
| `habitLogId` | Last created habit log | ✅ Create Habit Log |
| `goalId` | Last created goal | ✅ Create Goal |
| `budgetId` | Last created budget | ✅ Create Budget |
| `transactionId` | Last created transaction | ✅ Create Transaction |
| `journalEntryId` | Last created journal entry | ✅ Create Journal Entry |
| `notificationId` | Last created notification | ✅ Create Notification |

## 📋 Collection Overview

### 01 - Auth
- Register, Login, Logout
- Email verification (OTP)
- Token refresh
- Get current user

### 02 - Tasks
- Full CRUD operations
- Pagination and filtering
- Search by title/description
- Filter by due date

### 03 - Habits
- Full CRUD operations
- Streak tracking
- Frequency settings

### 04 - Habit Logs
- Log daily habit completion
- View habit history
- Date range filtering

### 05 - Goals
- Goal creation and tracking
- Link tasks and habits
- Log progress updates

### 06 - Budgets
- Monthly budget categories
- Spending alerts
- Budget vs actual summary

### 07 - Transactions
- Income/expense tracking
- Category filtering
- Financial summaries
- Date range reports

### 08 - Journal Entries
- Daily journaling
- Mood tracking (1-5 scale)
- Tag-based search
- Mood analytics

### 09 - Notifications
- In-app notifications
- Mark read/unread
- Bulk mark as read
- Unread count

### 10 - Dashboard
- Aggregated statistics
- Task overview
- Quick insights

## 🧪 Testing Workflow Example

```
1. Auth → Register (create account)
2. Auth → Login (get tokens)
3. Tasks → Create Task (creates taskId)
4. Tasks → List Tasks (see all tasks)
5. Tasks → Update Task (modify task)
6. Habits → Create Habit (creates habitId)
7. Habit Logs → Create Habit Log (log completion)
8. Goals → Create Goal (link task/habit)
9. Budgets → Create Budget (set category limit)
10. Transactions → Create Transaction (record expense)
11. Journal Entries → Create Entry (daily journal)
12. Dashboard → Get Tasks Overview (see stats)
```

## 🔧 Tips

### Running Tests
- Collections include test scripts that auto-save IDs
- Check the **Tests** tab in each request
- View results in the **Test Results** tab after sending

### Chaining Requests
Use the `{{variable}}` syntax to reference saved IDs:
- `{{baseUrl}}/tasks/{{taskId}}`
- `{{baseUrl}}/habits/{{habitId}}`

### Manual Token Refresh
If your token expires:
1. Run `Auth → Refresh Token`
2. Or run `Auth → Login` again

### Creating New Environments
Duplicate `life-dashboard-local.json` for:
- Development: `http://localhost:3000`
- Staging: `https://staging-api.example.com`
- Production: `https://api.example.com`

## 📝 Example Request Bodies

### Create Task
```json
{
  "title": "Complete API documentation",
  "description": "Write comprehensive docs",
  "status": "todo",
  "priority": 2,
  "dueDate": "2024-12-31T23:59:59.000Z",
  "tags": [{ "name": "work" }]
}
```

### Create Habit
```json
{
  "name": "Morning Exercise",
  "description": "30 minutes workout",
  "frequency": "daily",
  "targetDays": [0, 1, 2, 3, 4, 5, 6],
  "reminderTime": "07:00",
  "color": "#FF5733"
}
```

### Create Transaction
```json
{
  "type": "expense",
  "amount": 45.50,
  "category": "groceries",
  "description": "Weekly shopping",
  "date": "2024-01-15",
  "tags": ["food"]
}
```

### Create Journal Entry
```json
{
  "title": "Productive Day",
  "content": "Today was very productive...",
  "mood": 4,
  "tags": ["gratitude"],
  "date": "2024-01-15"
}
```

## 🐛 Troubleshooting

### 401 Unauthorized
- Run `Auth → Login` to get fresh tokens
- Check that `Authorization` header is set to `Bearer {{accessToken}}`

### 404 Not Found
- Verify the entity ID exists in your environment
- Run the "Create" request first to populate IDs

### 400 Bad Request
- Check request body format
- Verify required fields are present
- Check date formats (ISO 8601)

## 📚 Additional Resources

- Swagger UI: `{{baseUrl}}/api/docs`
- API Health Check: `{{baseUrl}}/health`
