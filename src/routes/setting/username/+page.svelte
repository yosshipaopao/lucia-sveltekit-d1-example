<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	export let form: ActionData;
	export let data: PageData;
</script>

<h1>Change username</h1>
<form method="post" use:enhance>
	<label for="username">username</label>
	<input name="username" id="username" value={data.username} /><br />
	<input type="submit" />
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
<a href="/login">Sign in</a>
