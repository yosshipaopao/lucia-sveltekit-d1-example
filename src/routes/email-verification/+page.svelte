<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { Turnstile } from 'svelte-turnstile';
	import { browser } from '$app/environment';

	export let form: ActionData;

	$: if (browser && form) reset?.();

	let reset: () => void | undefined;
</script>

<h1>Email verification</h1>
<p>Your email verification link was sent to your inbox (i.e. console).</p>
<h2>Resend verification link</h2>
<form method="post" use:enhance>
	<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} bind:reset />
	<input type="submit" value="Resend" />
</form>
{#if form?.success}
	<p>Your verification link was resent</p>
{/if}
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
