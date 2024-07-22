<script>
	// your script goes here
	import { fly } from "svelte/transition";
	import { cubicInOut } from "svelte/easing";

	export let collapsed = false

	function collapseTransition(node, { duration = 200, easing = cubicInOut}){
		const h = parseFloat(getComputedStyle(node).height)

		return {
			duration,
			easing,
			css: (t) => `height: ${h * t}px`
		}
	}
</script>

<div class="content">
	{#if !collapsed}
		<div class="slot"
			class:collapsed
			transition:collapseTransition>
			<slot/>
		</div>
	{/if}
</div>

<style>
	.content {
		overflow-y: hidden;
		max-height: fit-content;
		height: fit-content;
	}

	.slot {
		display: flex;
		flex-direction: column;
	}
</style>
