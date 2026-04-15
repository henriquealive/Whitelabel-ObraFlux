#!/usr/bin/env node
/**
 * Standalone migration script using the Prisma query engine (NOT schema engine).
 * Applies the initial SQL migration by executing each statement via $executeRawUnsafe.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function migrate() {
  const prisma = new PrismaClient();

  try {
    // Check if already migrated
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Tenant'
      ) AS exists
    `;

    if (result[0]?.exists === true) {
      console.log('[migrate] Tables already exist — skipping migration.');
      return;
    }

    console.log('[migrate] Applying initial migration...');

    const migrationPath = path.join(
      __dirname,
      'prisma/migrations/20260415000000_init/migration.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split on double-newline after semicolon to get logical blocks,
    // then strip comment lines and execute the raw SQL.
    const blocks = sql.split(/;\s*\n\n+/);

    for (const block of blocks) {
      // Remove comment lines, trim whitespace
      const stmt = block
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim();

      if (!stmt) continue;

      await prisma.$executeRawUnsafe(stmt + ';');
    }

    console.log('[migrate] Initial migration applied successfully.');
  } catch (err) {
    console.error('[migrate] FATAL: Migration failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
