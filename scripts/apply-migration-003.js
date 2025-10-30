/**
 * Apply Migration 003: Fix RLS Policies
 * 
 * Run this script to fix the RLS policies that are blocking player creation.
 * This should be run once to update the database.
 * 
 * Usage: node scripts/apply-migration-003.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pzrfctfdpfmbwssmkerp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmZjdGZkcGZtYndzc21rZXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzQyOTIsImV4cCI6MjA3NzE1MDI5Mn0.DijuiEuq0jT5mBXbEtnqxKin7jfxTqx5bj3K_Ki2wkA';

console.log('🔧 Applying Migration 003: Fix RLS Policies');
console.log('Supabase URL:', supabaseUrl);

// Read migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/003_fix_rls_policies.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('\n📄 Migration SQL:');
console.log('---');
console.log(migrationSQL);
console.log('---\n');

// Note: This requires a service role key, not anon key
console.log('⚠️  Note: This migration requires SUPABASE_SERVICE_ROLE_KEY to be set.');
console.log('⚠️  The anon key does not have permissions to modify RLS policies.');
console.log('\n📋 Manual Steps:');
console.log('1. Go to: https://pzrfctfdpfmbwssmkerp.supabase.co/project/pzrfctfdpfmbwssmkerp/sql');
console.log('2. Copy and paste the SQL above');
console.log('3. Click "Run" to execute the migration');
console.log('\nOr use the Supabase CLI with a linked project.');
