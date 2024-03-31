import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	password: text('password').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false)
});

export const sessions = sqliteTable('user_session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	expiresAt: integer('expires_at').notNull()
});

export const email_verification_tokens = sqliteTable('email_verification_token', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	expires_at: integer('expires', { mode: 'timestamp' }).notNull()
});

export const password_reset_tokens = sqliteTable('password_reset_token', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	expires_at: integer('expires', { mode: 'timestamp' }).notNull()
});
