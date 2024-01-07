<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { Turnstile } from 'svelte-turnstile';
	import { browser } from '$app/environment';

	export let form: ActionData;
	export let data: PageData;

	$: if (browser && form) reset?.();

	let reset: () => void | undefined;
</script>

<h1>Change UserId</h1>
{#if form?.success}
	<p>Success! Your userId has been changed.</p>
{:else}
	<form method="post" use:enhance>
		<label for="userId">userId</label>
		<input name="userId" id="userId" value={data.userId} /><br />
		<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} bind:reset />
		<input type="submit" />
	</form>
	{#if form?.message}
		<p class="error">{form.message}</p>
	{/if}
	<a href="/login">Sign in</a>
{/if}
