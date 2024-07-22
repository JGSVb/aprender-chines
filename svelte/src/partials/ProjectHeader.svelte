<script>
	export let title
	export let url
</script>

<header>
	<div class="title">
		{title}
	</div>
	<div class="url">
		{url}
	</div>
</header>

<style>
	header {
		z-index: 500;
		text-align: center;
		background-color: var(--bg1);
		height: fit-content;
		padding: 10px;
		border-width: 0px;
		border-bottom: 1px solid var(--border1);

		box-shadow: 0px 10px 10px var(--shadow);
	}

	.title {
		font-weight: bold;
	}

	.url {
		font-size: 15px;
	}
</style>
