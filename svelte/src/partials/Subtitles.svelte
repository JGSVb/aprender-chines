<script>
	import draggable from "../lib/draggable";
	import api from "../lib/api";
	export let player

	let string = "中华民国北洋政府12在巴黎和会上未能维护国家利益"
	let words = []

	$: api.invoke("break_words", {
		"dictionary": "cedict",
		string }).then(response => words = response)

</script>

<div class="subtitles-toplevel" use:draggable={{ applyStyles: true }}>
	{#each words as w}
		{#if w[3]}
			<button class="dictionary-word">
				<span class="upper">
					{w[2].simplified}
				</span>
				<span class="lower">
					{w[2].pinyin}
				</span>
			</button>
		{:else}
			<span>{w[2]}</span>
		{/if}
	{/each}
</div>

<style>
	.subtitles-toplevel {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: left;
		align-items: center;
		max-width: 80%;
		height: fit-content;

		position: relative;
		pointer-events: all;

		padding: 10px;
		border-radius: 10px;
		border: 1px solid var(--color1);
		background-color: var(--bg-floating);
		box-shadow: 3px 3px 5px var(--shadow);

	}

	.dictionary-word {
		all: unset;
		cursor: pointer;

		display: flex;
		flex-direction: column;
	}

	.dictionary-word span {
		transition-duration: 0.05s;
		transition-timing-function: ease-in-out;
	}

	.dictionary-word:hover span {
		color: var(--color1);
	}

	.lower {
		font-size: var(--font-extra-small);
	}
</style>
