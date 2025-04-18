import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './src/schema';

// drizzle-seed provides the db instance based on drizzle.config.ts
export default async function seed(db: DrizzleD1Database<typeof schema>) {
	console.log('🌱 Seeding database using drizzle-seed...');
	const start = Date.now();

	try {
		// --- Define Seed Data ---
		const seedData: schema.InsertSensorReading[] = [
			{
				temperature: 24.8,
				humidity: 55.2,
				co2: 420,
				o2: 20.9,
				ph: 6.9,
				pressure: 1012.5,
				moisture: 45.0,
				ir: 150,
				conductivity: 1.2,
			},
			{
				temperature: 26.1,
				humidity: 62.0,
				co2: 500,
				o2: 20.8,
				ph: 7.0,
				moisture: 50.5,
				ir: 180,
				conductivity: 1.4,
			},
			{
				temperature: 23.5,
				humidity: 58.5,
				co2: 405,
				o2: 21.0,
				ph: 6.7,
				pressure: 1010.0,
				moisture: 48.2,
				ir: 165,
				conductivity: 1.3,
			},
		];

		console.log(`   Inserting ${seedData.length} seed records...`);

		// --- Insert Data ---
		// Consider adding .onConflictDoNothing() if you want to avoid duplicates on re-runs
		const result = await db.insert(schema.sensorReadings).values(seedData).returning();

		const end = Date.now();
		console.log(`✅ Seeding finished in ${end - start}ms.`);
		console.log(`   Inserted ${result.length} records.`);
	} catch (error) {
		console.error('❌ Seeding failed:', error);
		process.exit(1); // Exit with error code if seeding fails
	}
}
