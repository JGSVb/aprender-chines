<script>
	export let entry
	export let dictionary
</script>

<tr class="entry">
	<td class="chinese">
		{#if dictionary == "ptdict"}
			{entry.chinese}
		{:else if dictionary == "cedict"}
			{entry.simplified}
		{/if}

	</td>

	<td class="pinyin">{entry.pinyin}</td>

	<td>
		{#if dictionary == "ptdict"}
			{entry.portuguese}
		{:else if dictionary  ==  "cedict"}
			{entry.english}
		{/if}
	</td>
</tr>

<style>
	.entry {
		display: table-row;
		gap: 10px;
	}

	.chinese {
		font-weight: bold;
		color: var(--text-highlight);
		min-width: 100px;
	}

	.pinyin {
		font-weight: bold;
	}

	.pinyin::before {
		content: "(";
	}
	.pinyin::after {
		content: ")";
	}

</style>
