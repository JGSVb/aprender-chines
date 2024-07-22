<script>
	// your script goes here
	import Fa from "svelte-fa";
	import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
	import Collapsible from "./Collapsible.svelte";

	export let enabled = true
	let collapsed = true
	$: effectiveCollapsed = !enabled || collapsed

</script>

<article class:highlight={!effectiveCollapsed}>
	<button class="header"
		disabled={!enabled}
		class:disabled={!enabled}
		on:click={() => {collapsed = !collapsed}}>
		<div class="icon" class:collapsed={effectiveCollapsed}>
			<Fa icon={faCaretDown}/>
		</div>
		<div class="header">
			<slot name="header"/>
		</div>
	</button>

	<div class="collapsible">
		<Collapsible bind:collapsed>
			<hr>
			<slot/>
		</Collapsible>
	</div>
	
</article>

<style>

	.highlight {
		background-color: var(--bg3);
		border: 1px solid var(--border2);
	}

	article {
		display: flex;
		flex-direction: column;

		background-color: var(--bg2);
		border: 1px solid var(--border1);
	}

	hr {
		opacity: 0.5;
		border-bottom: 1px;
		border-color: var(--border2);
		box-shadow: 1px 1px 3px var(--shadow);

		flex: 1;
	}

	.header {
		all: unset;

		display: flex;
		flex-direction: row;
		gap: 10px;
		padding: 4px;

		cursor: pointer;
		user-select: none;
	}

	.disabled, .disabled * {
		background-color: var(--bg-disabled);
		color: var(--fg-disabled);
		cursor: default !important;
	}

	.icon {
		all: unset;
		margin-left: 10px;
	}

	.collapsed {
		transform: rotate(-90deg);
	}

	.collapsible {
		box-shadow: inset 0px 10px 10px var(--shadow);
	}

	.icon, article {
		transition-duration: 0.2s;
		transition-timing-function: ease-in-out;
	}
</style>
