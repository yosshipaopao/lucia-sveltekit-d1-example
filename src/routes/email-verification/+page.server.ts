import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { generateEmailVerificationToken, isVailedEmailVerificationToken } from '$lib/server/token';
import { isValidString } from '$lib/utils/string';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';
import { validateTurnstileToken } from '$lib/server/turnstile';
import { sendEmailVerificationLink } from '$lib/server/email';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/signup');
	if (locals.user.emailVerified) redirect(302, '/');
	return {};
};
export const actions: Actions = {
	validate: async ({ locals, request }) => {
		if (!locals.user) return fail(401);
		if (locals.user.emailVerified) return fail(401);
		const formData = await request.formData();
		const code = formData.get('code');
		const turnstileToken = formData.get('cf-turnstile-response');
		if (!isValidString(code, 6, 6)) return fail(400);
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
		const result = await isVailedEmailVerificationToken(locals.user.id, code, locals.DB);
		if (!result) return fail(400);
		await locals.DB.update(users)
			.set({ emailVerified: true })
			.where(eq(users.id, locals.user.id))
			.execute();
		redirect(302, '/');
	},
	resend: async ({ locals, request }) => {
		if (!locals.user) return fail(401);
		if (locals.user.emailVerified) return fail(401);
		const formData = await request.formData();
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
		const token = await generateEmailVerificationToken(locals.user.id, locals.DB);
		await sendEmailVerificationLink(locals.user.email, token);
	}
};
