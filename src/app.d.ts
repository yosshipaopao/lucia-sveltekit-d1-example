declare global {
	namespace App {
		interface Locals {
			lucia: import('$lib/server/lucia').Auth;
			db: D1Database;
			DB: import('drizzle-orm/d1').DrizzleD1Database;
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
			};
		}
	}
}

export {};
