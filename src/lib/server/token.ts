import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo';
import { alphabet, generateRandomString, sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { email_verification_tokens, password_reset_tokens } from '$lib/schema';
import { and, eq } from 'drizzle-orm';
import { generateId } from 'lucia';

const hashTokenId = async (tokenId: string): Promise<string> =>
	encodeHex(await sha256(new TextEncoder().encode(tokenId)));

export const generateEmailVerificationToken = async (
	userId: string,
	db: DrizzleD1Database
): Promise<string> => {
	// optionally invalidate all existing tokens
	await db.delete(email_verification_tokens).where(eq(email_verification_tokens.userId, userId));
	const code = generateRandomString(6, alphabet('0-9', 'A-Z'));
	const codeHash = await hashTokenId(code);
	await db.insert(email_verification_tokens).values({
		id: codeHash,
		userId,
		expires_at: createDate(new TimeSpan(2, 'h'))
	});
	return code;
};

export const isVailedEmailVerificationToken = async (
	userId: string,
	code: string,
	db: DrizzleD1Database
): Promise<boolean> => {
	const tokenHash = await hashTokenId(code);
	const storedToken = await db
		.delete(email_verification_tokens)
		.where(
			and(eq(email_verification_tokens.userId, userId), eq(email_verification_tokens.id, tokenHash))
		)
		.returning()
		.get();
	if (!storedToken) return false;
	if (!isWithinExpirationDate(storedToken.expires_at)) return false;

	return true;
};

export const generatePasswordResetToken = async (
	userId: string,
	db: DrizzleD1Database
): Promise<string> => {
	// optionally invalidate all existing tokens
	await db.delete(password_reset_tokens).where(eq(password_reset_tokens.userId, userId));
	const tokenId = generateId(63);
	const tokenHash = await hashTokenId(tokenId);
	await db.insert(password_reset_tokens).values({
		id: tokenHash,
		userId,
		expires_at: createDate(new TimeSpan(2, 'h'))
	});
	return tokenId;
};

export const validatePasswordResetToken = async (
	tokenId: string,
	db: DrizzleD1Database
): Promise<string> => {
	const tokenHash = await hashTokenId(tokenId);
	const storedToken = await db
		.delete(password_reset_tokens)
		.where(eq(password_reset_tokens.id, tokenHash))
		.returning()
		.get();
	if (!storedToken) throw new Error('Invalid token');
	if (!isWithinExpirationDate(storedToken.expires_at)) throw new Error('Expired token');

	return storedToken.userId;
};
