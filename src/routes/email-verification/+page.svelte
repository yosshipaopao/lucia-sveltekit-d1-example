<script lang="ts">
	import { enhance } from '$app/forms';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { Turnstile } from 'svelte-turnstile';
	let reset: () => void | undefined;
</script>

<h1>Email verification</h1>
<form method="post" action="?/validate" use:enhance>
	<input name="code" type="text" />
	<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} bind:reset />
	<input type="submit" value="submit" />
</form>

<form method="post" action="?/resend" use:enhance>
	<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} bind:reset />
	<input type="submit" value="resend" />
</form>
