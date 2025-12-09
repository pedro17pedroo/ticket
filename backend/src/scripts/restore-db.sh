#!/bin/bash

# Configuration
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/../.."

# Load .env
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Defaults
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-tatuticket}
DB_USER=${POSTGRES_USER:-postgres}
export PGPASSWORD=${POSTGRES_PASSWORD:-root}

# Check argument
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Error: Please specify the backup file to restore."
  echo "Usage: npm run restore -- <path_to_backup_file>"
  echo "Example: npm run restore -- ./backups/tatuticket_20251209.sql"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: File '$BACKUP_FILE' not found!"
  exit 1
fi

echo "⚠️  WARNING: This will OVERWRITE the database '$DB_NAME' with data from '$BACKUP_FILE'."
echo "Host: $DB_HOST:$DB_PORT"
echo "Target DB: $DB_NAME"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Starting restore..."

# Drop and recreate schema public to ensure clean state (optional but recommended for full restore)
# Or simpler: just run psql
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"; then
  echo "✅ Restore completed successfully!"
else
  echo "❌ Restore failed!"
  exit 1
fi
