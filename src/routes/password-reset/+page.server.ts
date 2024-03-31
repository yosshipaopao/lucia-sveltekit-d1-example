import { fail } from '@sveltejs/kit';
import { generatePasswordResetToken } from '$lib/server/token';
import { isValidEmail, sendPasswordResetLink } from '$lib/server/email';

import type { Actions } from './$types';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';
import { validateTurnstileToken } from '$lib/server/turnstile';
import { isValidString } from '$lib/utils/string';

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
		const turnstileToken = formData.get('cf-turnstile-response');
		if (!isValidString(turnstileToken)) {
			return fail(400, {
				message: 'Invalid turnstile token'
			});
		}
		const { success, error } = await validateTurnstileToken(turnstileToken);
		if (!success) {
			return fail(400, {
				message: error || 'Invalid turnstile token'
			});
		}
		const storedUser = await locals.DB.select()
			.from(users)
			.where(eq(users.email, email.toLocaleLowerCase()))
			.get();
		if (!storedUser) {
			return fail(400, {
				message: 'User does not exist'
			});
		}
		const token = await generatePasswordResetToken(storedUser.id, locals.DB);
		await sendPasswordResetLink(email, token);
		return {
			success: true
		};
	}
};
