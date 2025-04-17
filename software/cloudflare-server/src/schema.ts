import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sensorReadings = sqliteTable('SensorReadings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(), // Store as Unix epoch seconds
  temperature: real('temperature'),
  humidity: real('humidity'),
  co2: real('co2'),
  o2: real('o2'),
  ph: real('ph'),
  pressure: real('pressure'),
  moisture: real('moisture'),
  ir: real('ir'),
  conductivity: real('conductivity'),
  imageUrl: text('imageUrl'), // Add nullable text column for image URL
});

// Optional: Define a type for inserting data if needed
export type InsertSensorReading = typeof sensorReadings.$inferInsert; 