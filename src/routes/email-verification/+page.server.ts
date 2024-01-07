import { redirect, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session?.user.emailVerified) {
		redirect(302, '/');
	}
	return {};
};

