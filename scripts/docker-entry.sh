#!/bin/sh
set -e
cd /app

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  echo "SEED_ON_START=true — running database seed..."
  npx prisma db seed
else
  echo "Skipping seed (set SEED_ON_START=true to run prisma db seed on container start)."
fi

echo "Starting API..."
exec npx tsx src/index.ts
