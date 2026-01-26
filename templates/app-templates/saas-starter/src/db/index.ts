import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database connection singleton
 *
 * Uses postgres.js driver with Drizzle ORM for type-safe queries
 */

// Connection string from environment
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
const client = postgres(connectionString, {
  prepare: false, // Disable prepare for serverless environments
});

// Create drizzle instance with schema for relations
export const db = drizzle(client, { schema });

// Export types
export type Database = typeof db;
