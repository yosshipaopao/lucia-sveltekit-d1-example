<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { Turnstile } from 'svelte-turnstile';
	import { browser } from '$app/environment';

	export let form: ActionData;

	$: if (browser&&form) reset?.();

	let reset: () => void | undefined;
</script>

<h1>Sign up</h1>
<form method="post" use:enhance>
	<label for="username">Username</label>
	<input name="username" id="username" /><br />
	<label for="email">email</label>
	<input name="email" id="email" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} bind:reset/>
	<input type="submit" />
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
<a href="/login">Sign in</a>
