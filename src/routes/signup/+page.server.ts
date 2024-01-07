import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';
import { isValidEmail, sendEmailVerificationLink } from '$lib/server/email';
import { generateEmailVerificationToken } from '$lib/server/token';
import { validateToken } from '$lib/server/turnstile';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		// basic check
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
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
			const user = await locals.lucia.createUser({
				key: {
					providerId: 'email', // auth method
					providerUserId: email.toLowerCase(),
					password // hashed by Lucia
				},
				attributes: {
					username: `user-${Math.floor(Math.random() * 1000000)}`,
					email,
					emailVerified: Number(false)
				}
			});
			const session = await locals.lucia.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie
			const token = await generateEmailVerificationToken(user.userId, locals.DB);
			await sendEmailVerificationLink(email, token);
		} catch (e: any) {
			console.error(e);
			return fail(500, {
				message: e.message ?? 'An unknown error occurred'
			});
		}
		// redirect to
		return redirect(302, '/email-verification');
	}
};
