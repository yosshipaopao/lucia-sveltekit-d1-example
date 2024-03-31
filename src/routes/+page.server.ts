import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return redirect(302, '/login');
	if (!locals.user.emailVerified) return redirect(302, '/email-verification');
	return {
		userId: locals.user.id,
		username: locals.user.username
	};
};

export const actions: Actions = {
	logout: async ({ locals, cookies }) => {
		if (!locals.session) {
			return fail(401);
		}
		await locals.lucia.invalidateSession(locals.session.id);
		const sessionCookie = locals.lucia.createBlankSessionCookie();
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
		redirect(302, '/login'); // redirect to login page
	}
};
