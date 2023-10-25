import { LuciaError } from 'lucia';
import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';
import { isValidEmail } from '$lib/server/email';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';

import { validateToken } from '$lib/server/turnstile';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) throw redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const userId = formData.get('userId');
		const password = formData.get('password');
		// basic check
		if (typeof userId !== 'string' || userId.length < 1 || userId.length > 31) {
			return fail(400, {
				message: 'Invalid username'
			});
		}
		if (typeof password !== 'string' || password.length < 1 || password.length > 255) {
			return fail(400, {
				message: 'Invalid password'
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
			let provider_user = userId.toLowerCase();
			if (!isValidEmail(userId)) {
				const storedUser = await locals.DB.select({
					email: users.email
				})
					.from(users)
					.where(eq(users.id, userId))
					.get();
				if (!storedUser) {
					return fail(400, {
						message: 'User does not exist'
					});
				}
				provider_user = storedUser.email;
			}
			const key = await locals.lucia.useKey('email', provider_user, password);
			const session = await locals.lucia.createSession({
				userId: key.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie
		} catch (e) {
			if (
				e instanceof LuciaError &&
				(e.message === 'AUTH_INVALID_KEY_ID' || e.message === 'AUTH_INVALID_PASSWORD')
			) {
				// user does not exist
				// or invalid password
				return fail(400, {
					message: 'Incorrect username or password'
				});
			}
			return fail(500, {
				message: 'An unknown error occurred'
			});
		}
		throw redirect(302, '/');
	}
};
