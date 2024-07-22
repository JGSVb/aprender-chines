<script>
    import { onMount } from "svelte";
	import ThreeDots from "./ThreeDots.svelte";
	import draggable from "../lib/draggable.js"

	let left
	let root
	let width

	onMount(()=>{
		width = root.clientWidth / 2
	})

	function onResize(e){
		width = e.detail.clientX
	}
</script>

<section bind:this={root}>
	<div bind:this={left}
		class="child"
		style:width="{width}px">
		<slot name="left"/>
	</div>

	<div use:draggable on:dragged={onResize}>
		<div class="resize-handle">
			<ThreeDots/>	
		</div>
	</div >

	<div class="child right">
		<slot name="right"/>
	</div>
</section>

<style>
	.resize-handle {
		padding-left: 3px;
		padding-right: 3px;
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;

		border: 0px solid var(--border1);
		border-left-width: 1px;
		border-right-width: 1px;

		background-color: var(--bg1);

		cursor: col-resize;
	}
	
	section {
		display: flex;
		flex-direction:row;
		height: 100%;
		max-height: 100%;
	}

	.child {
		overflow-y: scroll;
		min-width: 200px;
	}

	.right {
		flex: 1;
	}
</style>
