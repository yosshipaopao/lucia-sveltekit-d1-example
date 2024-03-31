import { fail, redirect } from '@sveltejs/kit';
import { validatePasswordResetToken } from '$lib/server/token';

import type { PageServerLoad, Actions } from './$types';
import { isValidString } from '$lib/utils/string';
import { Argon2id } from 'oslo/password';
import { users } from '$lib/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const userId = await validatePasswordResetToken(params.token, locals.DB);
		if (!userId) redirect(302, '/password-reset');
	} catch (e) {
		redirect(302, '/password-reset');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const password = formData.get('password');
		// basic check
		if (!isValidString(password, 6, 255)) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		const userId = await validatePasswordResetToken(params.token, locals.DB);
		const hashedPassword = await new Argon2id().hash(password);
		await locals.DB.update(users)
			.set({ password: hashedPassword })
			.where(eq(users.id, userId))
			.execute();

		return { success: true };
	}
};
