import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';
import { isValidEmail, sendEmailVerificationLink } from '$lib/server/email';
import { generateEmailVerificationToken } from '$lib/server/token';
import { validateTurnstileToken } from '$lib/server/turnstile';
import { isValidString } from '$lib/utils/string';
import { generateId } from 'lucia';
import { users } from '$lib/schema';
import { generate } from '$lib/server/hash';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		const turnstileToken = formData.get('cf-turnstile-response');
		// basic check
		if (!isValidString(password, 6, 255)) {
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
		try {
			const hashedPassword = await generate(password);
			const userId = generateId(15);
			await locals.DB.insert(users).values({
				id: userId,
				username: `user-${Math.floor(Math.random() * 1000000)}`,
				email,
				password: hashedPassword
			});
			// create session
			const session = await locals.lucia.createSession(userId, {});
			const sessionCookie = locals.lucia.createSessionCookie(session.id);
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
			// send email verification link
			const token = await generateEmailVerificationToken(userId, locals.DB);
			await sendEmailVerificationLink(email, token);
			// for dev
			return fail(400, { message: `token is ${token}` });
		} catch (e) {
			console.error(e);
			return fail(500, {
				message: 'An unknown error occurred'
			});
		}
		// redirect to
		// redirect(302, '/email-verification');
	}
};
