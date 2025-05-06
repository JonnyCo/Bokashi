import { sqliteTable, AnySQLiteColumn, integer, real, text, numeric } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const sensorReadings = sqliteTable("SensorReadings", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	timestamp: integer().default(sql`(strftime('%s', 'now'))`).notNull(),
	temperature: real(),
	humidity: real(),
	co2: real(),
	o2: real(),
	ph: real(),
	pressure: real(),
	moisture: real(),
	ir: real(),
	conductivity: real(),
});

export const imageTable = sqliteTable("ImageTable", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	imageUrl: text(),
	timestamp: integer().default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const conductivity = sqliteTable("Conductivity", {
	id: integer().primaryKey({ autoIncrement: true }),
	liquidLevel: real().default(sql`(NULL)`),
	foodWasteMoisture: real().default(sql`(NULL)`),
	timestamp: numeric().default(sql`(NULL)`),
});

