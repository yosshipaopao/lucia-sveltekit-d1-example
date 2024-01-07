import { redirect, fail } from '@sveltejs/kit';
import { generateEmailVerificationToken } from '$lib/server/token';
import { sendEmailVerificationLink } from '$lib/server/email';

import type { PageServerLoad, Actions } from './$types';
import { validateToken } from '$lib/server/turnstile';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) return redirect(302, '/login');
	if (session.user.emailVerified) {
		redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const session = await locals.auth.validate();
		if (!session) return redirect(302, '/login');
		if (session.user.emailVerified) {
			redirect(302, '/');
		}
		const formData = await request.formData();
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
			const token = await generateEmailVerificationToken(session.user.userId, locals.DB);
			const { success, errors } = await sendEmailVerificationLink(session.user.email, token);
			if (!success) {
				return fail(500, {
					message: errors
				});
			}
			return {
				success: true
			};
		} catch {
			return fail(500, {
				message: 'An unknown error occurred'
			});
		}
	}
};
