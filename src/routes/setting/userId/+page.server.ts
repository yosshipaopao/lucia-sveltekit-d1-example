import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { validateToken } from '$lib/server/turnstile';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) return redirect(302, '/login');
	if (!session.user.emailVerified) return redirect(302, '/email-verification');
	return {
		userId: session.user.userId,
		username: session.user.username
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const session = await locals.auth.validate();
		if (!session) return redirect(302, '/login');
		if (!session.user.emailVerified) return redirect(302, '/email-verification');
		const formData = await request.formData();
		// check turnstile
		const token = formData.get('cf-turnstile-response');
		if (typeof token !== 'string') return fail(400, { message: 'Invalid turnstile token' });
		const { success, error } = await validateToken(token);
		if (!success) return fail(400, { message: error || 'Invalid turnstile token' });
		const userId = formData.get('userId');
		if (typeof userId !== 'string' || userId.length < 1 || userId.length > 31)
			return fail(400, { message: 'Invalid userId' });
		if (!/^[a-zA-Z0-9_-]+$/.test(userId))
			return fail(400, { message: 'userId contains characters that cannot be used' });
		try {
			await locals.DB.update(users)
				.set({ id: userId.toLowerCase() })
				.where(eq(users.id, session.user.userId));
		} catch (e: any) {
			return fail(400, { message: e?.message ?? 'An unknown error occurred' });
		}
		return {
			success: true
		};
	}
};
