import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { dev } from '$app/environment';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { sessions, users } from '$lib/schema';

export const initializeLucia = (db: DrizzleD1Database) => {
	const adapter = new DrizzleSQLiteAdapter(db, sessions, users);
	return new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				secure: !dev
			}
		},
		getUserAttributes: (attributes) => {
			return {
				username: attributes.username,
				email: attributes.email,
				emailVerified: attributes.emailVerified
			};
		}
	});
};
export type Auth = ReturnType<typeof initializeLucia>;

declare module 'lucia' {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
		DatabaseUserAttributes: Omit<typeof users.$inferSelect, 'id'>;
	}
}
