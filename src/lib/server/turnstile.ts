import { TURNSTILE_SECRET_KEY } from '$env/static/private';

export interface TokenValidateResponse {
	'error-codes': string[];
	success: boolean;
	action: string;
	cdata: string;
}

export async function validateToken(token: string) {
	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: `{"response":"${token}","secret":"${TURNSTILE_SECRET_KEY}"}` 
	});
	return {
		success: response.status === 200,
		error: response.status === 200 ? null : await response.text()
	};
}
