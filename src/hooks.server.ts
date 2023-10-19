import type { Handle } from '@sveltejs/kit';
import { initializeLucia } from '$lib/server/lucia';
import { createBridge } from 'cfw-bindings-wrangler-bridge';
import { dev } from '$app/environment';
import { drizzle } from 'drizzle-orm/d1';

export const handle: Handle = async ({ event, resolve }) => {
	if (dev) {
		const bridge = createBridge();
		event.locals.db = bridge.D1Database('DB');
	} else {
		event.locals.db = <D1Database>event.platform?.env.DB;
	}
	event.locals.DB = drizzle(event.locals.db);
	event.locals.lucia = initializeLucia(event.locals.db);
	event.locals.auth = event.locals.lucia.handleRequest(event);
	return resolve(event);
};
