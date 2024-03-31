import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';
import { isValidString } from '$lib/utils/string';
import { validateTurnstileToken } from '$lib/server/turnstile';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return redirect(302, '/login');
	if (!locals.user.emailVerified) return redirect(302, '/email-verification');
	return {
		userId: locals.user.id,
		username: locals.user.username
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) return redirect(302, '/login');
		if (!locals.user.emailVerified) return redirect(302, '/email-verification');
		const formData = await request.formData();

		const userId = formData.get('userId');
		if (!isValidString(userId, 5, 30)) {
			return fail(400, {
				message: 'Invalid userId'
			});
		}
		if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
			return fail(400, {
				message: 'userId contains characters that cannot be used'
			});
		}
		try {
			await locals.DB.update(users)
				.set({ id: userId.toLowerCase() })
				.where(eq(users.id, locals.user.id));
		} catch (e: any) {
			return fail(400, { message: e?.message ?? 'An unknown error occurred' });
		}
		return {
			success: true
		};
	}
};
