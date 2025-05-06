import { sqliteTable, integer, text, real, numeric } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sensorReadings = sqliteTable('SensorReadings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	timestamp: integer('timestamp', { mode: 'timestamp' })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(), // Store as Unix epoch seconds
	temperature: real('temperature'),
	humidity: real('humidity'),
	co2: real('co2'),
	o2: real('o2'),
	pressure: real('pressure'),
	ir: real('ir'),
});

export const ImageTable = sqliteTable('ImageTable', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	imageUrl: text('imageUrl'),
	timestamp: integer('timestamp', { mode: 'timestamp' })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const conductivity = sqliteTable('Conductivity', {
	id: integer().primaryKey({ autoIncrement: true }),
	liquidLevel: real().default(sql`(NULL)`),
	foodWasteMoisture: real().default(sql`(NULL)`),
	timestamp: numeric().default(sql`(NULL)`),
});

// Optional: Define a type for inserting data if needed
export type InsertSensorReading = typeof sensorReadings.$inferInsert;
