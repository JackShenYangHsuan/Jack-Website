# Database Setup Guide

This guide will help you set up PostgreSQL for the Gmail Auto-Tagger application.

## Option 1: Local PostgreSQL Installation (Recommended for Development)

### Step 1: Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database and User

```bash
# Access PostgreSQL as superuser
psql postgres

# In PostgreSQL prompt, run:
CREATE DATABASE gmail_auto_tagger;
CREATE USER gmail_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE gmail_auto_tagger TO gmail_user;

# Grant schema privileges
\c gmail_auto_tagger
GRANT ALL ON SCHEMA public TO gmail_user;

# Exit psql
\q
```

### Step 3: Run Schema Migration

```bash
# Navigate to backend directory
cd backend

# Run the schema creation script
psql -U gmail_user -d gmail_auto_tagger -f database/schema.sql

# (Optional) Run seed data for testing
psql -U gmail_user -d gmail_auto_tagger -f database/seed.sql
```

### Step 4: Configure Environment Variables

Update your `backend/.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gmail_auto_tagger
DB_USER=gmail_user
DB_PASSWORD=your_secure_password
```

### Step 5: Verify Connection

Test database connection:
```bash
psql -U gmail_user -d gmail_auto_tagger -c "SELECT * FROM users;"
```

---

## Option 2: Cloud PostgreSQL (Recommended for Production)

### Using Supabase (Free Tier Available)

1. **Sign up** at [supabase.com](https://supabase.com)
2. **Create new project** and wait for setup to complete
3. **Get connection string** from Settings → Database
4. **Run schema** using Supabase SQL Editor:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `backend/database/schema.sql`
   - Execute the SQL

5. **Update `.env`** with Supabase credentials:
```env
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
```

### Using ElephantSQL (Free Tier Available)

1. **Sign up** at [elephantsql.com](https://www.elephantsql.com)
2. **Create new instance** (Tiny Turtle plan is free)
3. **Copy connection details** from instance dashboard
4. **Run schema** using their browser-based SQL tool or psql:
```bash
psql your_elephantsql_url < backend/database/schema.sql
```

5. **Update `.env`** with ElephantSQL URL format

### Using Railway (Free Tier Available)

1. **Sign up** at [railway.app](https://railway.app)
2. **Create new PostgreSQL service**
3. **Get connection details** from Variables tab
4. **Connect and run schema**:
```bash
psql your_railway_postgres_url < backend/database/schema.sql
```

---

## Database Schema Overview

### Tables

**users**
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `gmail_token_encrypted` (TEXT) - Encrypted OAuth refresh token
- `created_at`, `updated_at` (Timestamps)

**rules**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `label_name` (VARCHAR) - Gmail label to apply
- `rule_description` (TEXT) - Natural language rule
- `priority` (INTEGER, 1-10) - Higher = higher priority
- `is_active` (BOOLEAN) - Enable/disable rule
- `created_at`, `updated_at` (Timestamps)

**tagging_logs**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `email_id` (VARCHAR) - Gmail message ID
- `applied_label` (VARCHAR) - Label that was applied
- `matched_rule_id` (UUID, Foreign Key → rules)
- `confidence_score` (DECIMAL) - AI match confidence (0.00-1.00)
- `timestamp` (Timestamp)

### Indexes

Performance indexes on:
- `users.email`
- `rules.user_id` and `rules.is_active`
- `tagging_logs.user_id`, `email_id`, and `timestamp`

---

## Troubleshooting

### Connection Issues

**"FATAL: password authentication failed"**
- Verify credentials in `.env` file
- Check PostgreSQL `pg_hba.conf` for authentication method

**"FATAL: database does not exist"**
- Ensure database was created: `CREATE DATABASE gmail_auto_tagger;`

**"Connection refused"**
- Check if PostgreSQL is running: `pg_isready`
- Verify port 5432 is not blocked by firewall

### Migration Issues

**"ERROR: permission denied for schema public"**
```sql
\c gmail_auto_tagger
GRANT ALL ON SCHEMA public TO gmail_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gmail_user;
```

**"ERROR: relation already exists"**
- Drop and recreate tables if starting fresh:
```sql
DROP TABLE IF EXISTS tagging_logs CASCADE;
DROP TABLE IF NOT EXISTS rules CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
Then re-run `schema.sql`

---

## Useful Commands

```bash
# Connect to database
psql -U gmail_user -d gmail_auto_tagger

# List all tables
\dt

# Describe table structure
\d users

# View table data
SELECT * FROM users;

# Count rules per user
SELECT user_id, COUNT(*) FROM rules GROUP BY user_id;

# View recent tagging activity
SELECT * FROM tagging_logs ORDER BY timestamp DESC LIMIT 10;

# Backup database
pg_dump -U gmail_user gmail_auto_tagger > backup.sql

# Restore database
psql -U gmail_user gmail_auto_tagger < backup.sql
```

---

## Next Steps

After database setup:
1. ✅ Verify connection with test query
2. ⏭️ Continue to Task 1.9: Install npm dependencies
3. ⏭️ Move to Task 2.0: Backend API implementation

---

**Need help?** Check PostgreSQL logs or open an issue on GitHub.
