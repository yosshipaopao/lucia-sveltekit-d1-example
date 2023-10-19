import { generateRandomString, isWithinExpiration } from 'lucia/utils';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { email_verification_token, password_reset_token } from '$lib/schema';
import { eq } from 'drizzle-orm';

const EXPIRES_IN = 1000 * 60 * 60 * 2; // 2 hours

export const generateEmailVerificationToken = async (userId: string, db: DrizzleD1Database) => {
	const storedUserTokens = await db
		.select()
		.from(email_verification_token)
		.where(eq(email_verification_token.userId, userId));
	if (storedUserTokens.length > 0) {
		const reusableStoredToken = storedUserTokens.find((token) => {
			// check if expiration is within 1 hour
			// and reuse the token if true
			return isWithinExpiration(Number(token.expires) - EXPIRES_IN / 2);
		});
		if (reusableStoredToken) return reusableStoredToken.id;
	}
	const token = generateRandomString(63);
	await db.insert(email_verification_token).values({
		id: token,
		expires: new Date().getTime() + EXPIRES_IN,
		userId
	});
	return token;
};

export const validateEmailVerificationToken = async (token: string, db: DrizzleD1Database) => {
	const storedToken = await db
		.select()
		.from(email_verification_token)
		.where(eq(email_verification_token.id, token))
		.get();
	if (!storedToken) throw new Error('Invalid token');
	await db
		.delete(email_verification_token)
		.where(eq(email_verification_token.userId, storedToken.userId));
	const tokenExpires = storedToken.expires;
	if (!isWithinExpiration(tokenExpires)) {
		throw new Error('Expired token');
	}
	return storedToken.userId;
};

export const generatePasswordResetToken = async (userId: string, db: DrizzleD1Database) => {
	const storedUserTokens = await db
		.select()
		.from(password_reset_token)
		.where(eq(password_reset_token.userId, userId));
	if (storedUserTokens.length > 0) {
		const reusableStoredToken = storedUserTokens.find((token) => {
			// check if expiration is within 1 hour
			// and reuse the token if true
			return isWithinExpiration(token.expires - EXPIRES_IN / 2);
		});
		if (reusableStoredToken) return reusableStoredToken.id;
	}
	const token = generateRandomString(63);
	await db.insert(password_reset_token).values({
		id: token,
		expires: new Date().getTime() + EXPIRES_IN,
		userId
	});
	return token;
};

export const validatePasswordResetToken = async (token: string, db: DrizzleD1Database) => {
	const storedToken = await db
		.select()
		.from(password_reset_token)
		.where(eq(password_reset_token.id, token))
		.get();
	if (!storedToken) throw new Error('Invalid token');
	await db.delete(password_reset_token).where(eq(password_reset_token.id, token));
	const tokenExpires = Number(storedToken.expires); // bigint => number conversion
	if (!isWithinExpiration(tokenExpires)) {
		throw new Error('Expired token');
	}
	return storedToken.userId;
};

export const isValidPasswordResetToken = async (token: string, db: DrizzleD1Database) => {
	const storedToken = await db
		.select()
		.from(password_reset_token)
		.where(eq(password_reset_token.id, token))
		.get();
	if (!storedToken) return false;
	const tokenExpires = Number(storedToken.expires); // bigint => number conversion
	if (!isWithinExpiration(tokenExpires)) {
		return false;
	}
	return true;
};
