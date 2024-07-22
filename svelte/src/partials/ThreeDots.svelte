<script>
	export let radius = 3
	export let gap = 15

</script>

<svg width="{2*radius}" height="{2*gap + 2*radius}">
	{#each {length: 3} as _,i}
		<circle r="{radius}" cx="{radius}" cy="{i*gap + radius}" fill="currentColor"/>
	{/each}
</svg>

<style>
	
</style>
