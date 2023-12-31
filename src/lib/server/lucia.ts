import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { d1 } from '@lucia-auth/adapter-sqlite';
import { dev } from '$app/environment';
import { generate, validate } from '$lib/server/hash';

export const initializeLucia = (db: D1Database) => {
	return lucia({
		middleware: sveltekit(),
		env: dev ? 'DEV' : 'PROD',
		adapter: d1(db, { user: 'user', session: 'user_session', key: 'user_key' }),
		getUserAttributes: (data) => {
			return {
				username: data.username,
				email: data.email,
				emailVerified: Boolean(data.emailVerified)
			};
		},
		passwordHash:{
			generate,
			validate
		}
	});
};
export type Auth = ReturnType<typeof initializeLucia>;
