import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

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
	logout: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await locals.lucia.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
		redirect(302, '/login'); // redirect to login page
	}
};
