import { describe, expect, it } from 'vitest';

// Replace with your actual deployed worker URL
const WORKER_URL = "https://cloudflare-server.kyeshimizu.workers.dev"; 

if (WORKER_URL === "https://cloudflare-server.kyeshimizu.workers.dev") {
	console.warn("\n⚠️ WARNING: Replace 'YOUR_WORKER_URL_HERE' in test/index.test.ts with your actual deployed worker URL before running tests against production.\n");
	// Optionally, throw an error to prevent accidental runs against the placeholder
	// throw new Error("Worker URL not configured for production testing.");
}

describe('Worker (Production Test)', () => {

	// --- Test GET / ---
	it('should return success message on GET /', async () => {
		const resp = await fetch(`${WORKER_URL}/`);
		console.log("Response:", resp);
		expect(resp.status).toBe(200);
		const json: any = await resp.json();
		expect(json.success).toBe(true);
		expect(json.message).toBe('Bokashi API is running.');
	});

	// --- Test GET /readings ---
	it('should return existing readings on GET /readings', async () => {
		const resp = await fetch(`${WORKER_URL}/readings`);
		expect(resp.status).toBe(200);
		const json: any = await resp.json();
		expect(json.success).toBe(true);
		expect(Array.isArray(json.data)).toBe(true);
	});

	// --- Test POST /readings (JSON) ---
	it('should insert sensor data via JSON on POST /readings', async () => {
		const sensorData = {
			temperature: 25.5,
			humidity: 60.1,
			co2: 450,
			_testMarker: `json-${Date.now()}` // Add a marker to identify test data
		};
		const resp = await fetch(`${WORKER_URL}/readings`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(sensorData),
		});

		expect(resp.status).toBe(201);
		const json: any = await resp.json();
		expect(json.success).toBe(true);
		expect(json.insertedId).toBeTypeOf('number');
		expect(json.imageUrl).toBeNull();

		// Verification by fetching again (optional, depends on eventual consistency)
		const getResp = await fetch(`${WORKER_URL}/readings`);
		const getData: any = await getResp.json();
		const insertedRecord = getData.data.find((r: any) => r.id === json.insertedId);
		expect(insertedRecord).toBeDefined();
		expect(insertedRecord.temperature).toBe(sensorData.temperature);
	});

	// --- Test POST /readings (Multipart/Form-Data) ---
	it('should insert sensor data and image via FormData on POST /readings', async () => {
		const sensorData = {
			temperature: 22.1,
			ph: 6.8,
			_testMarker: `form-${Date.now()}` // Add a marker to identify test data
		};
		const sensorDataString = JSON.stringify(sensorData);

		const mockImage = new Blob(['mock production test image content'], { type: 'image/png' });
		const formData = new FormData();
		formData.append('image', mockImage, 'prod-test-image.png');
		formData.append('sensorData', sensorDataString);

		const resp = await fetch(`${WORKER_URL}/readings`, {
			method: 'POST',
			body: formData as any,
		});

		expect(resp.status).toBe(201);
		const json: any = await resp.json();
		expect(json.success).toBe(true);
		expect(json.insertedId).toBeTypeOf('number');
		expect(json.imageUrl).toBeTypeOf('string');
		expect(json.imageUrl?.endsWith('-prod-test-image.png')).toBe(true);

		// Verification by fetching again (optional)
		const getResp = await fetch(`${WORKER_URL}/readings`);
		const getData: any = await getResp.json();
		const insertedRecord = getData.data.find((r: any) => r.id === json.insertedId);
		expect(insertedRecord).toBeDefined();
		expect(insertedRecord.imageUrl).toBe(json.imageUrl);
	});

	// --- Test POST /readings (Error Cases) ---
	// Note: Running error cases against production might not be ideal
	it('should return 400 for multipart request missing image', async () => {
		const sensorData = { temperature: 20 };
		const formData = new FormData();
		formData.append('sensorData', JSON.stringify(sensorData));
		const resp = await fetch(`${WORKER_URL}/readings`, { method: 'POST', body: formData as any });
		expect(resp.status).toBe(400);
	});

	it('should return 400 for multipart request missing sensorData', async () => {
		const mockImage = new Blob(['content'], { type: 'image/jpeg' });
		const formData = new FormData();
		formData.append('image', mockImage, 'photo.jpg');
		const resp = await fetch(`${WORKER_URL}/readings`, { method: 'POST', body: formData as any });
		expect(resp.status).toBe(400);
	});

	it('should return 400 for JSON request with empty body', async () => {
		const resp = await fetch(`${WORKER_URL}/readings`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});
		expect(resp.status).toBe(400);
	});

	it('should return 415 for unsupported content type', async () => {
		const resp = await fetch(`${WORKER_URL}/readings`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body: 'some text',
		});
		expect(resp.status).toBe(415);
	});

}); 