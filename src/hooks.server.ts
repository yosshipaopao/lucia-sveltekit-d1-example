import type { Handle } from '@sveltejs/kit';
import { initializeLucia } from '$lib/server/lucia';
import { drizzle } from 'drizzle-orm/d1';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
	if (dev) {
		const { unstable_dev } = await import('wrangler');
		const { getBindings } = await import('cfw-bindings-wrangler-bridge');
		const worker = await unstable_dev(
			'./node_modules/cfw-bindings-wrangler-bridge/worker/index.js',
			{
				experimental: { disableExperimentalWarning: true }
			}
		);
		const env: App.Platform['env'] = await getBindings({
			bridgeWorkerOrigin: `http://${worker.address}:${worker.port}`
		});
		event.platform = { env };
	}
	event.locals.db = <D1Database>event.platform?.env.DB;
	event.locals.DB = drizzle(event.locals.db);
	event.locals.lucia = initializeLucia(event.locals.DB);

	const sessionId = event.cookies.get(event.locals.lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}
	const { session, user } = await event.locals.lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = event.locals.lucia.createSessionCookie(session.id);
		// sveltekit types deviates from the de-facto standard
		// you can use 'as any' too
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	if (!session) {
		const sessionCookie = event.locals.lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};
