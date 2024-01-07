import { HOST, DKIMPrivateKey, SENDER_EMAIL, DKIM_DOMAIN } from '$env/static/private';

export const sendEmailVerificationLink = async (email: string, token: string) => {
	const url = `${HOST}/email-verification/${token}`;
	return await sendEmail(
		email,
		'Verify your email',
		`Click the link below to verify your email:\n${url}`
	);
};

export const sendPasswordResetLink = async (email: string, token: string) => {
	const url = `${HOST}/password-reset/${token}`;
	return await sendEmail(
		email,
		'Reset your password',
		`Click the link below to reset your password:\n${url}`
	);
};

export const isValidEmail = (maybeEmail: unknown): maybeEmail is string => {
	if (typeof maybeEmail !== 'string') return false;
	if (maybeEmail.length > 255) return false;
	const emailRegexp = /^.+@.+$/; // [one or more character]@[one or more character]
	return emailRegexp.test(maybeEmail);
};

interface EmailAddress {
	email: string;
	name?: string;
}

interface Personalization {
	to: [EmailAddress, ...EmailAddress[]];
	from?: EmailAddress;
	dkim_domain?: string;
	dkim_private_key?: string;
	dkim_selector?: string;
	reply_to?: EmailAddress;
	cc?: EmailAddress[];
	bcc?: EmailAddress[];
	subject?: string;
	headers?: Record<string, string>;
}

interface ContentItem {
	type: string;
	value: string;
}

interface MailSendBody {
	personalizations: [Personalization, ...Personalization[]];
	from: EmailAddress;
	reply_to?: EmailAddress;
	subject: string;
	content: [ContentItem, ...ContentItem[]];
	headers?: Record<string, string>;
}

export const sendEmail = async (email: string, subject: string, body: string) => {
	const toEmailAddress: EmailAddress = {
		email
	};
	const fromEmailAddress: EmailAddress = {
		email: SENDER_EMAIL,
		name: 'Email Verifier'
	};
	const personalization: Personalization = {
		to: [toEmailAddress],
		from: fromEmailAddress,
		dkim_domain: DKIM_DOMAIN,
		dkim_selector: 'mailchannels',
		dkim_private_key: DKIMPrivateKey
	};
	const content: ContentItem = {
		type: 'text/plain',
		value: body
	};
	const payload: MailSendBody = {
		personalizations: [personalization],
		from: fromEmailAddress,
		subject,
		content: [content]
	};
	const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(payload)
	});
	if (response.status === 202) return { success: true };
	try {
		const { errors } = (await response.clone().json()) satisfies { errors: any };
		return { success: false, errors };
	} catch {
		return { success: false, errors: [response.statusText] };
	}
};
