<script lang="ts">
	import { enhance } from '$app/forms';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1>Profile</h1>
<p>{data.username}@{data.userId}</p>
<a href="setting/userId">Change UserId</a>
<a href="setting/username">Change UserName</a>
<form method="post" action="?/logout" use:enhance>
	<input type="submit" value="Sign out" />
</form>
