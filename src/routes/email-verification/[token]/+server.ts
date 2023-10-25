import { validateEmailVerificationToken } from '$lib/server/token';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { token } = params;
	try {
		const userId = await validateEmailVerificationToken(token, locals.DB);
		const user = await locals.lucia.getUser(userId);
		await locals.lucia.invalidateAllUserSessions(user.userId);
		await locals.lucia.updateUserAttributes(user.userId, {
			emailVerified: Number(true)
		});
		const session = await locals.lucia.createSession({
			userId: user.userId,
			attributes: {}
		});
		locals.auth.setSession(session);
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/setting/userId'
			}
		});
	} catch (e) {
		console.error(e);
		return new Response('Invalid email verification link', {
			status: 400
		});
	}
};
