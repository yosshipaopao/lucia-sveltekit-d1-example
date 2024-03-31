import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';
import { isValidString } from '$lib/utils/string';

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
		const username = formData.get('username');
		if (!isValidString(username, 1, 100)) {
			return fail(400, {
				message: 'Invalid username'
			});
		}
		try {
			await locals.DB.update(users).set({ username }).where(eq(users.id, locals.user.id));
		} catch (e: any) {
			return fail(400, {
				message: e?.message ?? 'An unknown error occurred'
			});
		}
		return {
			success: true
		};
	}
};
