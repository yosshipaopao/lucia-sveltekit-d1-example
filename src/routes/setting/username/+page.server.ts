import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/login');
	if (!session.user.emailVerified) throw redirect(302, '/email-verification');
	return {
		userId: session.user.userId,
		username: session.user.username
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const session = await locals.auth.validate();
		if (!session) throw redirect(302, '/login');
		if (!session.user.emailVerified) throw redirect(302, '/email-verification');
		const formData = await request.formData();
		const username = formData.get('username');
		if (typeof username !== 'string' || username.length < 1 || username.length > 31) return fail(400, { message: 'Invalid username' });
		try {
			await locals.DB.update(users).set({ username }).where(eq(users.id, session.user.userId));
		} catch (e: any) {
			return fail(400, { message: e?.message ?? 'An unknown error occurred' });
		}
		return {
			success: true
		};
	}
};