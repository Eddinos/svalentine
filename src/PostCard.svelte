<script>
	import { fly } from 'svelte/transition'
	import {send, receive} from './crossfade.js'
	import { createEventDispatcher } from 'svelte';
	export let transitionparams = {}
	export let style = {}
	export let legend = 'plouf'
	export let selected = null
	export let post = {}
	
	const dispatch = createEventDispatcher();
	
	const handleClick = e => {
		dispatch('expand')
	}
	
	function draw (node, {duration, x, y, delay, easing, final}) {
		return {
			duration,
			delay,
			css: t => {
				const eased = easing(t)
				
				return `transform: translate(${x-eased*x}px, ${y-eased*y}px) rotate(${eased * final}deg);
								opacity: ${eased};`
			}
		}
	}
	
</script>

<style>
	.postCard {
		align-self: center;
		justify-self: center;
		overflow: visible;
	}
	
	.postCard__card {
		background-color: #eee;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: center;
	}

	img {
		max-width: 200px;
	}
</style>

<div class="postCard" on:click={handleClick} in:draw={transitionparams} out:draw={{...transitionparams, delay: legend%10*200}} style={style}>
	{#if selected != legend}
	<!-- <div class="postCard__card" in:receive={{key: selected}} out:send={{key: selected}}> -->
		<img src={'./img/' + (post.srcSmall || '3.png')} alt="hotdog" in:receive|local={{key: selected}} out:send|local={{key: selected}} class="postCard__card">
	<!-- </div> -->
	{/if}
</div>
