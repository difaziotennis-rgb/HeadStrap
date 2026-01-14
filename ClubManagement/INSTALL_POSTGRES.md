# Installing PostgreSQL on macOS

Since PostgreSQL is not currently installed, here are the steps to install it:

## Quick Install (Recommended - using Homebrew)

### Step 1: Install Homebrew (if not installed)

Copy and paste this command in your terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the prompts. This may take a few minutes.

### Step 2: Install PostgreSQL

Once Homebrew is installed, run:

```bash
brew install postgresql@14
brew services start postgresql@14
```

### Step 3: Run the Setup Script

```bash
cd /Users/derek/new-website/ClubManagement
./setup-local-db.sh
```

## Alternative: Install PostgreSQL.app (GUI)

1. Download PostgreSQL from: https://www.postgresql.org/download/macosx/
2. Choose "PostgreSQL.app" - Download and install
3. Launch PostgreSQL.app from Applications
4. The default user is your macOS username (no password)
5. Run the setup script:
   ```bash
   cd /Users/derek/new-website/ClubManagement
   ./setup-local-db.sh
   ```

## After Installation

Once PostgreSQL is installed and running, the setup script will:
- Create the `clubmanagement` database
- Generate Prisma Client
- Push the database schema

Then you can run `npm run dev` and start using the booking system!


