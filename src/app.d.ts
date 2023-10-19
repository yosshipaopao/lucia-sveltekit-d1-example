declare global {
	namespace App {
		interface Locals {
			lucia: import('$lib/server/lucia').Auth;
			db: D1Database;
			DB: import('drizzle-orm/d1').DrizzleD1Database;
			auth: import('lucia').AuthRequest;
		}
		interface Platform {
			env: {
				DB: D1Database;
			};
		}
	}
}

/// <reference types="lucia" />
declare global {
	namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth;
		type DatabaseUserAttributes = {
			username: string;
			email: string;
			emailVerified: number;
		};
		type DatabaseSessionAttributes = Record<string, never>;
	}
}

export {};
