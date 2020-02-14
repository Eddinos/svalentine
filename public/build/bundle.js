
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }
    function crossfade(_a) {
        var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
        const to_receive = new Map();
        const to_send = new Map();
        function crossfade(from, node, params) {
            const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
            const to = node.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const dw = from.width / to.width;
            const dh = from.height / to.height;
            const d = Math.sqrt(dx * dx + dy * dy);
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            const opacity = +style.opacity;
            return {
                delay,
                duration: is_function(duration) ? duration(d) : duration,
                easing,
                css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
            };
        }
        function transition(items, counterparts, intro) {
            return (node, params) => {
                items.set(params.key, {
                    rect: node.getBoundingClientRect()
                });
                return () => {
                    if (counterparts.has(params.key)) {
                        const { rect } = counterparts.get(params.key);
                        counterparts.delete(params.key);
                        return crossfade(rect, node, params);
                    }
                    // if the node is disappearing altogether
                    // (i.e. wasn't claimed by the other list)
                    // then we need to supply an outro
                    items.delete(params.key);
                    return fallback && fallback(node, params, intro);
                };
            };
        }
        return [
            transition(to_send, to_receive, false),
            transition(to_receive, to_send, true)
        ];
    }

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

    /* src/PostCard.svelte generated by Svelte v3.18.2 */
    const file = "src/PostCard.svelte";

    // (57:1) {#if selected != legend}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;
    	let img_intro;
    	let img_outro;
    	let current;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "./img/" + (/*post*/ ctx[4].srcSmall || "3.png"))) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "hotdog");
    			attr_dev(img, "class", "postCard__card svelte-1qv8mm2");
    			add_location(img, file, 58, 2, 1303);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*post*/ 16 && img.src !== (img_src_value = "./img/" + (/*post*/ ctx[4].srcSmall || "3.png"))) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (local) {
    				add_render_callback(() => {
    					if (img_outro) img_outro.end(1);
    					if (!img_intro) img_intro = create_in_transition(img, receive, { key: /*selected*/ ctx[3] });
    					img_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			if (img_intro) img_intro.invalidate();

    			if (local) {
    				img_outro = create_out_transition(img, send, { key: /*selected*/ ctx[3] });
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching && img_outro) img_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(57:1) {#if selected != legend}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	let dispose;
    	let if_block = /*selected*/ ctx[3] != /*legend*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "postCard svelte-1qv8mm2");
    			attr_dev(div, "style", /*style*/ ctx[1]);
    			add_location(div, file, 55, 0, 1038);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    			dispose = listen_dev(div, "click", /*handleClick*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*selected*/ ctx[3] != /*legend*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(div, "style", /*style*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, draw, /*transitionparams*/ ctx[0]);
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, draw, {
    				.../*transitionparams*/ ctx[0],
    				delay: /*legend*/ ctx[2] % 10 * 200
    			});

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_outro) div_outro.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function draw(node, { duration, x, y, delay, easing, final }) {
    	return {
    		duration,
    		delay,
    		css: t => {
    			const eased = easing(t);

    			return `transform: translate(${x - eased * x}px, ${y - eased * y}px) rotate(${eased * final}deg);
								opacity: ${eased};`;
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { transitionparams = {} } = $$props;
    	let { style = {} } = $$props;
    	let { legend = "plouf" } = $$props;
    	let { selected = null } = $$props;
    	let { post = {} } = $$props;
    	const dispatch = createEventDispatcher();

    	const handleClick = e => {
    		dispatch("expand");
    	};

    	const writable_props = ["transitionparams", "style", "legend", "selected", "post"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("transitionparams" in $$props) $$invalidate(0, transitionparams = $$props.transitionparams);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    		if ("legend" in $$props) $$invalidate(2, legend = $$props.legend);
    		if ("selected" in $$props) $$invalidate(3, selected = $$props.selected);
    		if ("post" in $$props) $$invalidate(4, post = $$props.post);
    	};

    	$$self.$capture_state = () => {
    		return {
    			transitionparams,
    			style,
    			legend,
    			selected,
    			post
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("transitionparams" in $$props) $$invalidate(0, transitionparams = $$props.transitionparams);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    		if ("legend" in $$props) $$invalidate(2, legend = $$props.legend);
    		if ("selected" in $$props) $$invalidate(3, selected = $$props.selected);
    		if ("post" in $$props) $$invalidate(4, post = $$props.post);
    	};

    	return [transitionparams, style, legend, selected, post, handleClick];
    }

    class PostCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			transitionparams: 0,
    			style: 1,
    			legend: 2,
    			selected: 3,
    			post: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostCard",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get transitionparams() {
    		throw new Error("<PostCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionparams(value) {
    		throw new Error("<PostCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<PostCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<PostCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get legend() {
    		throw new Error("<PostCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set legend(value) {
    		throw new Error("<PostCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<PostCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<PostCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get post() {
    		throw new Error("<PostCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<PostCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const pictures = [
        {
            id: 1,
            srcSmall: "1.jpg",
            srcLarge: "1.jpg",
            text: "Depuis quelques temps, il se passe beaucoup de choses assez incroyables dans ma vie. J'ai commencé par découvrir un nouveau quartier..."
        },
        {
            id: 2,
            srcSmall: "2.jpg",
            srcLarge: "2.jpg",
            text: "Je suis allé à un nouveau festival"
        },
        {
            id: 3,
            srcSmall: "3.gif",
            srcLarge: "3.gif",
            text: "J'ai navigué dans des canaux"
        },
        {
            id: 4,
            srcSmall: "4s.jpg",
            srcLarge: "4.jpg",
            text: "Découvert une petite île méditerranéenne"
        },
        {
            id: 5,
            srcSmall: "5s.jpg",
            srcLarge: "5.jpg",
            text: "Je suis allé voir des expositions lumineuses"
        },
        {
            id: 6,
            srcSmall: "6.jpg",
            srcLarge: "6.jpg",
            text: "Je me suis mis au roller derby, j'ai même vu un match au zénith !"
        },
        {
            id: 7,
            srcSmall: "7s.jpg",
            srcLarge: "7.jpg",
            text: "Je suis allé au mariage de mes nouveau amis"
        },
        {
            id: 8,
            srcSmall: "8.jpg",
            srcLarge: "8.jpg",
            text: "J'ai fait du patin à glace à Stockholm"
        },
        {
            id: 9,
            srcSmall: "9.jpg",
            srcLarge: "9.jpg",
            text: "Visité Prague de bas..."
        },
        {
            id: 10,
            srcSmall: "10.jpg",
            srcLarge: "10.jpg",
            text: "en haut !"
        },
        {
            id: 11,
            srcSmall: "11s.jpg",
            srcLarge: "11.jpg",
            text: "J'ai fait des petits weekend de détente, peu importe la météo"
        },
        {
            id: 12,
            srcSmall: "12s.jpg",
            srcLarge: "12.jpg",
            text: "Essayé 80% des restos parisiens"
        },
        {
            id: 13,
            srcSmall: "13.jpg",
            srcLarge: "13.jpg",
            text: "J'ai aussi fait le meilleur voyage de ma vie, pendant lequel j'ai vécu des aventures tous les jours"
        },
        {
            id: 14,
            srcSmall: "14s.jpg",
            srcLarge: "14.jpg",
            text: "Comme mettre un sarong pour visiter des temples de toutes formes"
        },
        {
            id: 15,
            srcSmall: "15s.jpg",
            srcLarge: "15.jpg",
            text: "Ou travailler mes cuisses et mes fesses en montant des centaines de marches"
        },
        {
            id: 16,
            srcSmall: "16s.jpg",
            srcLarge: "16.jpg",
            text: "Mais avec des cascades en récompense, pas dégueu"
        },
        {
            id: 17,
            srcSmall: "17s.jpg",
            srcLarge: "17.jpg",
            text: "J'ai aussi traversé des rizières qui s'étendent à perte de vue, avec leurs animaux et leurs déesses du riz"
        },
        {
            id: 18,
            srcSmall: "18.jpg",
            srcLarge: "18.jpg",
            text: "Admiré des paysages magnifique au rythme du soleil, et fait de la balançoire"
        },
        {
            id: 19,
            srcSmall: "19.jpg",
            srcLarge: "19.jpg",
            text: "Pris des risques en respirant du souffre, mais pas de trop près non plus, donc ça va"
        },
        {
            id: 20,
            srcSmall: "20.jpg",
            srcLarge: "20.jpg",
            text: "J'ai vu le jour se lever sur un volcan"
        },
        {
            id: 21,
            srcSmall: "21.gif",
            srcLarge: "21.gif",
            text: "Puis un autre"
        },
        {
            id: 22,
            srcSmall: "22.jpg",
            srcLarge: "22.jpg",
            text: "Heureusement j'ai pu aussi me relaxer"
        },
        {
            id: 23,
            srcSmall: "23.jpg",
            srcLarge: "23.jpg",
            text: "Sur des plages infinies avec un petit jus de coco, des chèvres, des singes et des vaches bien sûr"
        },
        {
            id: 24,
            srcSmall: "24s.jpg",
            srcLarge: "24.jpg",
            text: "J'ai plongé dans la mer pour chercher némo, les autres poissons et sa pote la tortue"
        },
        {
            id: 25,
            srcSmall: "25s.jpg",
            srcLarge: "25.jpg",
            text: "Même en France les découvertes furent nombreuses, au Sud..."
        },
        {
            id: 26,
            srcSmall: "26.jpg",
            srcLarge: "26.jpg",
            text: "Comme au Nord"
        },
        {
            id: 27,
            srcSmall: "27s.jpg",
            srcLarge: "27.jpg",
            text: "J'ai fini par entrer dans une nouvelle décennie, en étant patient et en dansant un petit peu quand même"
        },
        {
            id: 28,
            srcSmall: "28.jpg",
            srcLarge: "28.jpg",
            text: "J'ai fait la connaissance d'une championne de ski"
        },
        {
            id: 29,
            srcSmall: "29.jpg",
            srcLarge: "29.jpg",
            text: "Avec qui j'ai bravé les pistes les plus dangereuses"
        },
        {
            id: 30,
            srcSmall: "30s.jpg",
            srcLarge: "30.jpg",
            text: "Le froid de la neige m'a donné envie de me réchauffer au Danemark"
        },
        {
            id: 31,
            srcSmall: "31.jpg",
            srcLarge: "31.jpg",
            text: "En mangeant un petit hotdog, parce qu'il y avait plus de pain pour les gros, mais c'était déjà pas mal"
        },
        {
            id: 32,
            srcSmall: "32.jpg",
            srcLarge: "32.jpg",
            text: "C'était aussi l'occasion de faire des échanges culturels avec les corbeaux locaux"
        },
        {
            id: 33,
            srcSmall: "33.gif",
            srcLarge: "33.gif",
            text: "En tout cas c'était très joli, et maintenant je sais prononcer Nyhavn"
        },
        {
            id: 34,
            srcSmall: "34s.jpg",
            srcLarge: "34.jpg",
            text: "Car j'ai bien pris le temps de m'instruire"
        },
        {
            id: 35,
            srcSmall: "35s.jpg",
            srcLarge: "35.jpg",
            text: "Pendant tout ce temps j'ai fait et reçu plus de bisous qu'il n'y a d'étoiles dans le ciel (je le sais car je les ai observées)"
        },
        {
            id: 36,
            srcSmall: "36s.jpg",
            srcLarge: "36.jpg",
            text: "Tous ces moments m'ont donné le sourire, c'est pourquoi il faut bien prendre soin de ses dents !" +
             "Pour tout ça je te remercie Emm, revoir toutes ces photos m'a rappelé pourquoi j'étais chaque jour heureux d'être avec toi. Je t'aime !"
        }
    ];

    /* src/App.svelte generated by Svelte v3.18.2 */
    const file$1 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (156:1) <PostCard transitionparams={{duration: 900, ...origin(index), easing: cubicOut, final: finalTransitions[index]}}      style="{`transform: rotate(${finalTransitions[index]}deg)`}"       legend="{post.id}"       on:expand={() => handleCardExpansion(post.id)}       selected={selected} post={post}>
    function create_default_slot(ctx) {
    	let t0_value = /*post*/ ctx[9] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cards*/ 2 && t0_value !== (t0_value = /*post*/ ctx[9] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(156:1) <PostCard transitionparams={{duration: 900, ...origin(index), easing: cubicOut, final: finalTransitions[index]}}      style=\\\"{`transform: rotate(${finalTransitions[index]}deg)`}\\\"       legend=\\\"{post.id}\\\"       on:expand={() => handleCardExpansion(post.id)}       selected={selected} post={post}>",
    		ctx
    	});

    	return block;
    }

    // (155:1) {#each cards as post, index (index)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let current;

    	function expand_handler(...args) {
    		return /*expand_handler*/ ctx[8](/*post*/ ctx[9], ...args);
    	}

    	const postcard = new PostCard({
    			props: {
    				transitionparams: {
    					duration: 900,
    					...origin(/*index*/ ctx[11]),
    					easing: cubicOut,
    					final: /*finalTransitions*/ ctx[3][/*index*/ ctx[11]]
    				},
    				style: `transform: rotate(${/*finalTransitions*/ ctx[3][/*index*/ ctx[11]]}deg)`,
    				legend: /*post*/ ctx[9].id,
    				selected: /*selected*/ ctx[0],
    				post: /*post*/ ctx[9],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	postcard.$on("expand", expand_handler);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(postcard.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(postcard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const postcard_changes = {};

    			if (dirty & /*cards*/ 2) postcard_changes.transitionparams = {
    				duration: 900,
    				...origin(/*index*/ ctx[11]),
    				easing: cubicOut,
    				final: /*finalTransitions*/ ctx[3][/*index*/ ctx[11]]
    			};

    			if (dirty & /*cards*/ 2) postcard_changes.style = `transform: rotate(${/*finalTransitions*/ ctx[3][/*index*/ ctx[11]]}deg)`;
    			if (dirty & /*cards*/ 2) postcard_changes.legend = /*post*/ ctx[9].id;
    			if (dirty & /*selected*/ 1) postcard_changes.selected = /*selected*/ ctx[0];
    			if (dirty & /*cards*/ 2) postcard_changes.post = /*post*/ ctx[9];

    			if (dirty & /*$$scope, cards*/ 4098) {
    				postcard_changes.$$scope = { dirty, ctx };
    			}

    			postcard.$set(postcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(postcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(155:1) {#each cards as post, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (167:0) {#if selected}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let p;
    	let t1_value = pictures[/*selected*/ ctx[0] - 1].text + "";
    	let t1;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			attr_dev(img, "class", "details__image svelte-gqq5yz");
    			if (img.src !== (img_src_value = `./img/${pictures[/*selected*/ ctx[0] - 1].srcLarge || "3.jpg"}`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 172, 2, 3538);
    			attr_dev(p, "class", "details__text svelte-gqq5yz");
    			add_location(p, file$1, 173, 2, 3639);
    			attr_dev(div0, "class", "details__content svelte-gqq5yz");
    			add_location(div0, file$1, 171, 1, 3505);
    			attr_dev(div1, "class", "details svelte-gqq5yz");
    			add_location(div1, file$1, 167, 0, 3393);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(p, t1);
    			current = true;
    			dispose = listen_dev(div1, "click", /*closeDetails*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*selected*/ 1 && img.src !== (img_src_value = `./img/${pictures[/*selected*/ ctx[0] - 1].srcLarge || "3.jpg"}`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty & /*selected*/ 1) && t1_value !== (t1_value = pictures[/*selected*/ ctx[0] - 1].text + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				if (!div1_intro) div1_intro = create_in_transition(div1, receive, { key: /*selected*/ ctx[0] });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, send, { key: /*selected*/ ctx[0] });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_outro) div1_outro.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(167:0) {#if selected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let button;
    	let t1;
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t2;
    	let if_block_anchor;
    	let current;
    	let dispose;
    	let each_value = /*cards*/ ctx[1];
    	const get_key = ctx => /*index*/ ctx[11];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let if_block = /*selected*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Piocher";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(button, "class", "drawButton svelte-gqq5yz");
    			add_location(button, file$1, 149, 0, 2912);
    			attr_dev(div, "class", "grid svelte-gqq5yz");
    			add_location(div, file$1, 153, 0, 2983);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    			dispose = listen_dev(button, "click", /*drawCards*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const each_value = /*cards*/ ctx[1];
    			group_outros();
    			validate_each_keys(ctx, each_value, get_each_context, get_key);
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
    			check_outros();

    			if (/*selected*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function origin(index) {
    	const column = index % 3;
    	let origin = { x: 0, y: 0 };

    	switch (column) {
    		case 0:
    			origin.x = window.innerWidth / 2;
    			break;
    		case 1:
    			origin.x = 0;
    			break;
    		case 2:
    			origin.x = -window.innerWidth / 2;
    			break;
    	}

    	if (index < 3) origin.y = window.innerHeight + 400;
    	if (index >= 3 && index < 6) origin.y = window.innerHeight / 2 + 400;
    	if (index >= 6) origin.y = 400;
    	return origin;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let selected = false;
    	let cards = [];
    	let counter = 0;
    	let nextPage = false;

    	function drawCards() {
    		// if (cards.length === 0) {
    		// 	cards = [1,2,3,4,5,6,7,8,9]
    		// } else {
    		// 	cards = []
    		// }
    		if (counter === pictures.length) {
    			$$invalidate(1, cards = []);
    			counter = 0;
    			return;
    		}

    		if (counter % 9 === 0 && counter !== 0 && !nextPage) {
    			$$invalidate(1, cards = []);
    			nextPage = true;
    		} else {
    			$$invalidate(1, cards = [...cards, pictures[counter]]);
    			counter++;
    			nextPage = false;
    		}
    	}

    	const finalTransitions = [...Array(9)].map(x => ~~(Math.random() * 360)).map(x => x > 60 && x < 180 ? 12 : x >= 180 && x < 310 ? 347 : x);
    	console.log(finalTransitions);

    	function handleCardExpansion(postCardId) {
    		$$invalidate(0, selected = postCardId);
    	}

    	function closeDetails() {
    		$$invalidate(0, selected = null);
    	}

    	const expand_handler = post => handleCardExpansion(post.id);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("cards" in $$props) $$invalidate(1, cards = $$props.cards);
    		if ("counter" in $$props) counter = $$props.counter;
    		if ("nextPage" in $$props) nextPage = $$props.nextPage;
    	};

    	return [
    		selected,
    		cards,
    		drawCards,
    		finalTransitions,
    		handleCardExpansion,
    		closeDetails,
    		counter,
    		nextPage,
    		expand_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
