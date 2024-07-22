<script>
	import api from "../lib/api";
	import CollapsibleEntry from "./CollapsibleEntry.svelte";
	import Debounce from "../lib/debounce";
	import DictionaryEntry from "./DictionaryEntry.svelte";

	export let query
	export let dictionary
	export let title

	let result = []
	let resultDebounce = new Debounce(response => result = response, 750)
	
	$: if(dictionary && query){
		api.invoke("search_dictionary", {
			query,
			dictionary
		}).then(response => {
			resultDebounce.debounce(response)
		})
	} else if(dictionary){
		result = []
	}

</script>

<CollapsibleEntry
	enabled={result.length > 0}>
	<div slot="header">
		{ title }
		<span class="exponent">{result.length}</span>
	</div>

	<div class="entries-wrapper">
		<table class="entries">
			{#each result as entry, i (entry)}
				<DictionaryEntry {entry} {dictionary} />
				{#if i < result.length - 1}
					<tr class="separator"><td colspan="3" /><tr/>
				{/if}
			{/each}
		</table>
	</div>
</CollapsibleEntry>

<style>
	
	.entries-wrapper {
		max-height: 300px;
		overflow-y: scroll;
	}

	.entries {
		flex-direction: column;
		padding: 5px;
		border-spacing: 5px;
	}

	.separator {
		height: 1px;
		width: 100%;
	}

	.separator td {
		background-color: var(--sep-fg);
		box-shadow: 1px 1px 3px var(--strong-shadow);
	}

	.exponent {
		position: relative;
		font-size: 15px;
		bottom: 1ex;
	}

</style>
