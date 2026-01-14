# Database Setup Guide for EliteClub OS

This project uses PostgreSQL with Prisma ORM. You need to set up a PostgreSQL database and configure the connection string.

## Option 1: Local PostgreSQL (Recommended for Development)

### 1. Install PostgreSQL
- **macOS**: `brew install postgresql@14` then `brew services start postgresql@14`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### 2. Create Database
```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE clubmanagement;
CREATE USER clubuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE clubmanagement TO clubuser;
\q
```

### 3. Update .env File
Update the `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://clubuser:yourpassword@localhost:5432/clubmanagement?schema=public"
```

## Option 2: Use Supabase (Free PostgreSQL Hosting)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** under "Connection pooling" (URI format)

### 2. Update .env File
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your actual values.

## Option 3: Other PostgreSQL Hosting Services

- **Railway**: [railway.app](https://railway.app)
- **Neon**: [neon.tech](https://neon.tech)
- **Render**: [render.com](https://render.com)

Each service will provide a connection string in the format:
```
postgresql://user:password@host:port/database?sslmode=require
```

## Setup Database Schema

After setting up your database connection:

```bash
cd ClubManagement
npx prisma generate
npx prisma db push
```

Or to run migrations:
```bash
npx prisma migrate dev --name init
```

## Verify Setup

Run this to test the connection:
```bash
npx prisma db pull
```

If successful, you're all set! If you get connection errors, check:
- Database is running (for local)
- Connection string is correct
- Firewall/network allows connections (for hosted)
- Credentials are correct


