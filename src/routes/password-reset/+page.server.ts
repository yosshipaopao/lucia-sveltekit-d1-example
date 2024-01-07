import { fail } from '@sveltejs/kit';
import { generatePasswordResetToken } from '$lib/server/token';
import { isValidEmail, sendPasswordResetLink } from '$lib/server/email';

import type { Actions } from './$types';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';
import { validateToken } from '$lib/server/turnstile';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		// basic check
		if (!isValidEmail(email)) {
			return fail(400, {
				message: 'Invalid email'
			});
		}

		// check turnstile
		const token = formData.get('cf-turnstile-response');
		if (typeof token !== 'string')
			return fail(400, {
				message: 'Invalid turnstile token'
			});
		const { success, error } = await validateToken(token);
		if (!success)
			return fail(400, {
				message: error || 'Invalid turnstile token'
			});

		try {
			const storedUser = await locals.DB.select().from(users).where(eq(users.email, email)).get();
			if (!storedUser) {
				return fail(400, {
					message: 'User does not exist'
				});
			}
			const user = locals.lucia.transformDatabaseUser({
				...storedUser,
				emailVerified: Number(storedUser.emailVerified)
			});
			const token = await generatePasswordResetToken(user.userId, locals.DB);
			await sendPasswordResetLink(email, token);
			return {
				success: true
			};
		} catch (e) {
			return fail(500, {
				message: 'An unknown error occurred'
			});
		}
	}
};
