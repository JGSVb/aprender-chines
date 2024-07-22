<script>
	import VerticalPanel from "../partials/VerticalPanel.svelte"
	import SplitView from "../partials/SplitView.svelte";
	import ProjectHeader from "../partials/ProjectHeader.svelte";
	import Dictionary from "../partials/Dictionary.svelte";
	import YoutubeIframe from "../partials/YoutubeIframe.svelte";
	import Subtitles from "../partials/Subtitles.svelte";

	let query
	let player

</script>

{@debug player}

<ProjectHeader title="Projeto" url="https://www.youtube.com/watch?v=GeRXGtjO6Fs"/>
<main>

	<VerticalPanel>
		banana
	</VerticalPanel>
	<SplitView>
		<div class="youtube" slot="left">
			<div class="overlay">
				<Subtitles bind:player />
			</div>
			<YoutubeIframe bind:player initialVideoId="GeRXGtjO6Fs"/>
		</div>

		<div slot="right"
			style:height="100%"
			style:background-color="var(--bg1)">

			<div class="search-dict-box">
				<input bind:value={query} class="search-dict-input" type="text"/>
			</div>

			<Dictionary bind:query title="Português" dictionary="ptdict"/>
			<Dictionary bind:query title="Inglês" dictionary="cedict"/>
			
		</div>
	</SplitView>
</main>

<style>

	.youtube {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.overlay {
		pointer-events: none;
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.search-dict-box {
		padding: 5px;
		box-sizing: border-box;
		display: flex;
	}

	.search-dict-input {
		padding: 5px;
		width: 100%;
		flex: 1;
		background-color: var(--bg2);
		border: 1px solid var(--border1);
	}

	.search-dict-input:focus {
		outline: none;
		border: 1px solid var(--border2);
	}

	main {
		position: relative;
		overflow-y: hidden;
		flex: 1;
	}

</style>
