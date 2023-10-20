<script lang="ts">
	import { enhance } from '$app/forms';
	import { Turnstile } from 'svelte-turnstile';
	import {PUBLIC_TURNSTILE_SITE_KEY} from '$env/static/public';
	import type { ActionData } from './$types';
	import { browser } from '$app/environment';

	export let form: ActionData;

	$: if (browser&&form) reset?.();

	let reset: () => void | undefined;
</script>

<h1>Sign in</h1>
<form method="post" use:enhance>
	<label for="username">Username</label>
	<input name="username" id="username" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} bind:reset/>
	<input type="submit" />
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
<a href="/signup">Create an account</a>
