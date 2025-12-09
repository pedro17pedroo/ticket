#!/bin/bash

# Configuration
# Identify directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Go to backend root
cd "$DIR/../.."

# Load .env variables if present
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Set defaults if not provided in .env
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-tatuticket}
DB_USER=${POSTGRES_USER:-postgres}
# PASSWORD should be in PGPASSWORD env var or .pgpass, but we can try to use POSTGRES_PASSWORD
export PGPASSWORD=${POSTGRES_PASSWORD:-root}

# Backup Directory
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

echo "Starting backup of database '$DB_NAME'..."
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Output: $FILENAME"

# Execute pg_dump
# We use --no-owner --no-acl to avoid permission issues when restoring to different users
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --no-owner --no-acl "$DB_NAME" > "$FILENAME"; then
  echo "✅ Backup completed successfully!"
  echo "Path: $(pwd)/$FILENAME"
  echo "Size: $(du -h "$FILENAME" | cut -f1)"
else
  echo "❌ Backup failed!"
  rm -f "$FILENAME"
  exit 1
fi
