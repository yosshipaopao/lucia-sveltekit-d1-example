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

<h1>Reset password</h1>
<form method="post" use:enhance>
	<label for="email">Email</label>
	<input name="email" id="email" /><br />
	<input type="submit" />

	<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} bind:reset />
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
{#if form?.success}
	<p>Your password reset link was sent to your inbox</p>
{/if}
<a href="/login">Sign in</a>
