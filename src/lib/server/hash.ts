async function generateSalt() {
	const randomBytes = new Uint8Array(16); // 16 bytes (128 bits)
	crypto.getRandomValues(randomBytes);
	const saltArray = Array.from(randomBytes);
	const salt = saltArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
	return salt;
}

export async function generate(password: string) {
	const salt = await generateSalt();
	const hashedPassword = await hashPassword(password, salt);
	return `${hashedPassword}:${salt}`;
}

async function hashPassword(password: string, salt: string) {
	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password);
	const saltBuffer = encoder.encode(salt);

	const algorithm = { name: 'PBKDF2' };
	const derivedBitsLength = 256;
	const iterations = 100000;

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		algorithm,
		false,
		['deriveBits']
	);

	const hashBuffer = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: saltBuffer,
			iterations: iterations,
			hash: 'SHA-256'
		},
		keyMaterial,
		derivedBitsLength
	);

	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

	return hashHex;
}

export async function validate(inputPassword: string, storedHash: string) {
	const [storedPassword, salt] = storedHash.split(':');
	const hashedPassword = await hashPassword(inputPassword, salt);
	return hashedPassword === storedPassword;
}
