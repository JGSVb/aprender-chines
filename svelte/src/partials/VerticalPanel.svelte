<script>
	import Fa from "svelte-fa";
	import { faXmark } from "@fortawesome/free-solid-svg-icons";
	import { fly } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
	import draggable from "../lib/draggable";

	let root
	let visible = false
	let handleVisible = !visible
	let width = 300

</script>

{#if visible}
	<section
		bind:this={root}
		style:width="{width}px"
		transition:fly={{ x: -root.clientWidth, duration: 200, easing: cubicInOut }}
		on:outroend={() => handleVisible = true }
		on:introstart={() => handleVisible = false}>

		<div class="vertical">

			<div class="toolbox">
				<button class="close" on:click={() => {
					visible = false
				}}>
					<Fa icon={ faXmark}/>
				</button>
			</div>

			<div class="content">
				<slot />
			</div>

		</div>

		<div class="resize-handle"
			use:draggable
			on:dragged={(e) => {
				const detail = e.detail
				width = detail.clientX
			}}/>

	</section>
{/if}

{#if handleVisible}
	<div class="show-handle-wrapper"
		transition:fly={{ x: -20, duration: 200, easing: cubicInOut}}
		on:outroend={() => visible = true }
		on:introstart={() => visible = false }>
		<button class="show-handle"
			on:click={() => handleVisible = false }/>
	</div>
{/if}

<style>

	section, .show-handle-wrapper {
		z-index: 10;
	}

	.resize-handle {
		border: 0px solid var(--border2);
		border-left-width: 1px;
		border-right-width: 1px;
		background-color: var(--bg3);
		height: 100%;
		width: 10px;
		cursor: col-resize;
	}

	section {
		position: absolute;

		height: 100%;

		display: flex;
		flex-direction: row;
		
		min-width: fit-content;
		max-width: 500px;

		background-color: var(--bg1);

		box-shadow: 10px 0px 10px var(--shadow);
	}

	.content {
		padding: 10px;
		box-sizing: border-box;
		flex: 1;
		
		width: 100%;
		height: 100%;
	}

	.vertical {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.close {
		all: unset;
		
		margin: 4px;
		margin-left: auto;

		right: 0;
	}
	
	.toolbox {
		display: flex;
		flex-direction: row;
		border: 0px solid var(--border1);
		border-bottom-width: 1px;
	}

	.show-handle-wrapper {
		position: absolute;
		height: 100%;
		width: 20px;
		display: flex;
		align-items: center;
	}

	.show-handle {
		all: unset;

		height: 90%;
		width: 100%;
		border-radius: 0px 10px 10px 0px;

		opacity: 0.2;
		background-color: var(--bg-disabled);
		transition-duration: 0.05s;
		transition-timing-function: ease-in-out;

		box-shadow: 10px 10px 10px var(--shadow);

		cursor: pointer;
	}

	.show-handle:hover {
		opacity: 0.5;
	}

</style>
