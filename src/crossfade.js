import { cubicOut } from 'svelte/easing';
import { crossfade, scale, fly } from 'svelte/transition';
const [send, receive] = crossfade({
    duration: d => Math.sqrt(d * 300),
    fallback: scale
    /*fallback(node, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;

        return {
            duration: 600,
            easing: cubicOut,
            css: t => `
                transform: ${transform} scale(${t});
                opacity: ${t}
            `
        };
    }*/
});

export {send, receive};