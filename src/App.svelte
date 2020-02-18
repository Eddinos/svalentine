<script>
	import {cubicOut} from 'svelte/easing'
	import {fade, fly} from 'svelte/transition'
	import {send, receive} from './crossfade.js'
	import PostCard from './PostCard.svelte'
	import postCards from './pictures.js'

	let selected = false
	let cards = []
	let counter = 0
	let nextPage = false
	
	function drawCards () {
		// if (cards.length === 0) {
		// 	cards = [1,2,3,4,5,6,7,8,9]
		// } else {
		// 	cards = []
		// }

		if (counter === postCards.length) {
			cards = []
			counter = 0
			return
		}

		if (counter%9 === 0 && counter !== 0 && !nextPage) {
			cards = []
			nextPage = true
		} else {
			cards = [...cards, postCards[counter]]
			counter++
			nextPage = false
		}
		
	}
	
	const finalTransitions = [...Array(9)].map(x=>~~(Math.random()*360)).map(x=>x > 60 && x < 180 ? 12 : x >= 180 && x < 310 ? 347 : x)
	console.log(finalTransitions)
	
	
	function origin (index) {
		const column = index%3
		let origin = {x: 0, y: 0}
		switch (column) {
			case 0: origin.x = window.innerWidth / 2;break;
			case 1: origin.x = 0;break;
			case 2: origin.x = -window.innerWidth / 2;break;
		}
		if (index < 3) origin.y = window.innerHeight + 400
		if (index >= 3 && index < 6) origin.y = window.innerHeight / 2 + 400
		if (index >= 6) origin.y = 400
		
		return origin
	}

	function handleCardExpansion (postCardId) {
		selected = postCardId; 
		document.body.classList.add('is-bg');
	}

	function closeDetails () {
		selected = null;
		document.body.classList.remove('is-bg');
	}
</script>

<style>
	.grid {
		display: grid;
		grid-template-columns: 33% 33% 33%;
		/* grid-template-rows: 33% 33% 33%;  */
		grid-auto-rows: 33%;
		height: 100%;
		overflow: hidden;
		transition: all .5s ease-out;
	}
	
	.details {
		position: absolute;
		top: 0;
		left:0;
		height: 100%;
		width: 100%;
		opacity: 1;
		background-color: rgba(41, 42, 43, .85);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		cursor: pointer;
		z-index: 11;
	}

	.details__image {
		max-width: 80vw;
		max-height: 67vh;
		border: solid 12px white;
		border-bottom-width: 36px;
	}

	.details__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.drawButton {
		position: fixed;
		bottom: 7%;
		right: 3%;
		border-radius: 50%;
		height: 100px;
		width: 100px;
		background-image: linear-gradient(25deg, #1DDD77, #1C6FE3);
    	color: white;
		font-size: 1.2em;
		cursor: pointer;
		font-family: 'Montserrat',sans-serif;
		border: none;
		transition: all .7s ease-out;
		background-size: 200%;
		z-index: 10;
	}

	.drawButton:hover {
		background-position: 100%;
	}

	.details__text {
		font-size: 2em;
		margin: 1em 20%;
		text-align: center;
		color: #eee;
	}

	@media (max-width: 640px) {
		.grid {
			overflow-x: hidden;
			overflow-y: auto;
			grid-template-columns: 100%;
			grid-auto-rows: 45%;
			scroll-behavior: smooth;
		}

		.details__text {
			margin: 1em 3%;
			font-size: 1.5em;
		}
	}
/* 
	.drawbButton.is-shuffling {
		transform: rotateY(1080deg);
		transition: transform 2.3s cubic-bezier(.3,.52,0,.98);
	} */
</style>


<button class="drawButton" on:click="{drawCards}">
	Piocher
</button>

<div class="grid">
	{#each cards as post, index (index)}
	<PostCard transitionparams={{duration: 900, ...origin(index), easing: cubicOut, final: finalTransitions[index]}}
			  style="{`transform: rotate(${finalTransitions[index]}deg)`}" 
			  legend="{post.id}" 
			  on:expand={() => handleCardExpansion(post.id)} 
			  selected={selected} post={post}>
		{post}
	</PostCard>
	
	{/each}
</div>

{#if selected}
<div class="details" 
	 in:receive={{key: selected}} 
	 out:send={{key: selected}} 
	 on:click={closeDetails}>
	<div class="details__content">
		<img class="details__image" src="{`./img/${postCards[selected - 1].srcLarge || '3.jpg'}`}" alt="">
		<p class="details__text">{postCards[selected - 1].text}</p>
	</div>
	
</div>
{/if}