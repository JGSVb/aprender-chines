<script>
	
</script>

<div class="overlay-container">
	<div class="overlay">
		<slot name="overlay" />
	</div>
	<div class="child">
		<slot />
	</div>
</div>

<style>
	.overlay-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.overlay {
		position: absolute;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.child {
		display: flex;
		width: 100%;
		height: 100%;
	}
</style>
