/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { desc } from 'drizzle-orm';
import * as schema from './schema';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

// Define Env and Variables types for Hono
type HonoEnv = {
	Bindings: Env; // Your Cloudflare bindings (needs DB: D1Database)
	Variables: {
		db: DrizzleD1Database<typeof schema>; // Define the type for the db variable
	};
};

// Initialize Hono App with the combined HonoEnv type
const app = new Hono<HonoEnv>();

// Add CORS middleware (Allow all origins by default)
// For production, configure specific origins: cors({ origin: 'https://yourdomain.com' })
app.use('*', cors());

// Add logger middleware
app.use('*', logger());

// Middleware to initialize Drizzle client per request
app.use('*', async (c, next) => {
	console.log('DB Binding in Test Environment:', c.env.DB);
	if (!c.env.DB) {
		console.error("D1 Database binding 'DB' not found.");
		return c.json({ success: false, error: 'D1 Database binding not found.' }, 500);
	}
	if (typeof c.env.DB.prepare !== 'function') {
		console.error('env.DB does not look like a D1Database binding!');
		return c.json({ success: false, error: 'Invalid D1 binding found in environment.' }, 500);
	}
	const db = drizzle(c.env.DB, { schema });
	c.set('db', db); // Now c.set knows about 'db' and its type
	await next();
});

// --- Routes ---

app.get('/', async (c) => {
	return c.json({ success: true, message: 'Bokashi API is running.' });
});

// GET /readings/all - Fetch all sensor readings
app.get('/readings/all', async (c) => {
	const db = c.get('db');
	// Consider adding filtering/pagination for large datasets in production
	// e.g., fetch only last 24 hours
	try {
		const allReadings = await db.select().from(schema.sensorReadings).orderBy(schema.sensorReadings.timestamp).all();
		return c.json({ success: true, data: allReadings });
	} catch (e: any) {
		console.error('Error fetching all readings:', e);
		return c.json({ success: false, error: `Failed to fetch all readings: ${e.message}` }, 500);
	}
});

// GET /readings/latest - Fetch the most recent sensor reading
app.get('/readings/latest', async (c) => {
	const db = c.get('db');
	try {
		const latestReading = await db.select().from(schema.sensorReadings).orderBy(desc(schema.sensorReadings.timestamp)).limit(1).get();

		// Return data as an array for consistency with /readings/all, even if only one item
		const data = latestReading ? [latestReading] : [];
		return c.json({ success: true, data: data });
	} catch (e: any) {
		console.error('Error fetching latest reading:', e);
		return c.json({ success: false, error: `Failed to fetch latest reading: ${e.message}` }, 500);
	}
});

// POST /readings - Insert new sensor reading (handles JSON and multipart/form-data)
app.post('/readings', async (c) => {
	const db = c.get('db');
	const contentType = c.req.header('content-type') || '';

	try {
		let sensorData: Partial<schema.InsertSensorReading>;
		let imageUrl: string | null = null;

		// --- Handle multipart/form-data (Image + Sensor Data) ---
		if (contentType.includes('multipart/form-data')) {
			const bucket = c.env.IMAGE_BUCKET;
			if (!bucket) {
				console.error("R2 Bucket binding 'IMAGE_BUCKET' not found.");
				return c.json({ success: false, error: 'R2 bucket binding not configured.' }, 500);
			}

			const formData = await c.req.formData();
			const imageFile = formData.get('image') as File | null;
			const sensorDataString = formData.get('sensorData') as string | null;

			if (!imageFile || !(imageFile instanceof File)) {
				return c.json({ success: false, error: "'image' field (File) is required in multipart/form-data." }, 400);
			}
			if (!sensorDataString) {
				return c.json({ success: false, error: "'sensorData' field (JSON string) is required in multipart/form-data." }, 400);
			}

			// Parse sensor data from string
			try {
				sensorData = JSON.parse(sensorDataString);
				if (!sensorData || Object.keys(sensorData).length === 0 || Object.values(sensorData).every((v) => v === undefined || v === null)) {
					return c.json({ success: false, error: 'Invalid or empty sensor data provided in sensorData field.' }, 400);
				}
			} catch (e) {
				return c.json({ success: false, error: 'Invalid JSON in sensorData field.' }, 400);
			}

			// Upload image
			const uniqueKey = `${Date.now()}-${imageFile.name}`;
			try {
				await bucket.put(uniqueKey, imageFile.stream(), {
					httpMetadata: { contentType: imageFile.type },
				});
				// Store the key for now. Configure R2 public access as needed.
				imageUrl = uniqueKey;
			} catch (uploadError: any) {
				console.error(`Failed to upload image ${uniqueKey} to R2:`, uploadError);
				return c.json({ success: false, error: `Image upload failed: ${uploadError.message}` }, 500);
			}

			// --- Handle application/json (Sensor Data only) ---
		} else if (contentType.includes('application/json')) {
			sensorData = await c.req.json<Partial<schema.InsertSensorReading>>();
			if (!sensorData || Object.keys(sensorData).length === 0 || Object.values(sensorData).every((v) => v === undefined || v === null)) {
				return c.json({ success: false, error: 'No sensor data provided in JSON body.' }, 400);
			}
			// imageUrl remains null

			// --- Handle other content types ---
		} else {
			return c.json({ success: false, error: 'Unsupported Content-Type. Use application/json or multipart/form-data.' }, 415);
		}

		// --- Database Insert (Common logic) ---
		const result = await db
			.insert(schema.sensorReadings)
			.values({
				temperature: sensorData.temperature ?? null,
				humidity: sensorData.humidity ?? null,
				co2: sensorData.co2 ?? null,
				o2: sensorData.o2 ?? null,
				ph: sensorData.ph ?? null,
				pressure: sensorData.pressure ?? null,
				moisture: sensorData.moisture ?? null,
				ir: sensorData.ir ?? null,
				conductivity: sensorData.conductivity ?? null,
				imageUrl: imageUrl, // Will be null for JSON, or the key for multipart
			})
			.returning({ insertedId: schema.sensorReadings.id });

		if (result && result.length > 0 && result[0].insertedId) {
			return c.json({ success: true, insertedId: result[0].insertedId, imageUrl: imageUrl }, 201);
		} else {
			console.error('Drizzle insert failed:', result);
			// Attempt cleanup if image was uploaded
			if (imageUrl && contentType.includes('multipart/form-data')) {
				const bucket = c.env.IMAGE_BUCKET;
				if (bucket) {
					try {
						await bucket.delete(imageUrl); // imageUrl is the uniqueKey here
						console.log(`Cleaned up uploaded image ${imageUrl} after DB insert failure.`);
					} catch (deleteError) {
						console.error(`Failed to clean up image ${imageUrl} after DB failure:`, deleteError);
					}
				}
			}
			return c.json({ success: false, error: 'Failed to insert data into database.' }, 500);
		}
	} catch (e: any) {
		// Catch JSON parsing errors specifically for application/json requests
		if (contentType.includes('application/json') && e instanceof SyntaxError) {
			return c.json({ success: false, error: 'Invalid JSON in request body.' }, 400);
		}
		console.error('Error processing POST /readings request:', e);
		return c.json({ success: false, error: `Server error: ${e.message || 'Unknown error'}` }, 500);
	}
});

// Default export Hono fetch handler
export default app;
