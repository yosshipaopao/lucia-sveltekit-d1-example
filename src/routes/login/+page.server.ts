import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';
import { isValidEmail } from '$lib/server/email';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';

import { validateTurnstileToken } from '$lib/server/turnstile';
import { isValidString } from '$lib/utils/string';
import { Argon2id } from 'oslo/password';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const userId = formData.get('userId');
		const password = formData.get('password');
		const turnstileToken = formData.get('cf-turnstile-response');
		// basic check
		if (!isValidString(userId, 3, 31)) {
			return fail(400, {
				message: 'Invalid username'
			});
		}
		if (!isValidString(password, 6, 255)) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		// check turnstile
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

		let provider_user = userId.toLowerCase();
		// allow user id login
		if (!isValidEmail(provider_user)) {
			const storedUser = await locals.DB.select({
				email: users.email
			})
				.from(users)
				.where(eq(users.id, provider_user))
				.get();
			if (!storedUser) {
				return fail(400, {
					message: 'Incorrect username or password'
				});
			}
			provider_user = storedUser.email;
		}

		// check
		const existingUser = await locals.DB.select({
			id: users.id,
			password: users.password,
			emailVerified: users.emailVerified
		})
			.from(users)
			.where(eq(users.id, provider_user))
			.get();
		if (!existingUser) {
			return fail(400, {
				message: 'Incorrect username or password'
			});
		}
		const validPassword = await new Argon2id().verify(existingUser.password, password);
		if (!validPassword) {
			return fail(400, {
				message: 'Incorrect username or password'
			});
		}
		// create session
		const session = await locals.lucia.createSession(existingUser.id, {});
		const sessionCookie = locals.lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		if (!existingUser.emailVerified) redirect(302, '/email-verification');
		redirect(302, '/');
	}
};
