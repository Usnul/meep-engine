import { DomElementBinding } from "./DomElementBinding.js";

export class DomElementManager {
    constructor() {
        /**
         *
         * @type {Engine|null}
         * @private
         */
        this.__engine = null;

        /**
         *
         * @type {Element|null}
         */
        this.__root = null;

        /**
         *
         * @type {DomElementBindingDescription[]}
         * @private
         */
        this.__descriptors = [];

        /**
         *
         * @type {DomElementBinding[]}
         * @private
         */
        this.__bindings = [];

        /**
         *
         * @type {Map<Element, DomElementBinding[]>}
         * @private
         */
        this.__element_to_bindings = new Map();

        /**
         *
         * @type {function}
         * @private
         */
        this.__bound_mutation_callback = this.__mutation_callback.bind(this);

        /**
         *
         * @type {MutationObserver}
         * @private
         */
        this.__mutation_observer = new MutationObserver(this.__bound_mutation_callback);
    }

    /**
     *
     * @param {DomElementBindingDescription} descriptor
     */
    register(descriptor) {
        this.__descriptors.push(descriptor);
    }

    /**
     *
     * @param {sequence<MutationRecord>} mutations_list
     * @param {MutationObserver} observer
     * @private
     */
    __mutation_callback(mutations_list, observer) {
        for (const mutation of mutations_list) {

            if (mutation.type === 'childList') {

                const added_nodes = mutation.addedNodes;
                const removed_nodes = mutation.removedNodes;


                const added_nodes_count = added_nodes.length;

                for (let i = 0; i < added_nodes_count; i++) {
                    const node = added_nodes[i];

                    this.__handleAttachedElement(node);
                }

                const removed_nodes_count = removed_nodes.length;

                for (let i = 0; i < removed_nodes_count; i++) {
                    const node = removed_nodes[i];

                    this.__handleRemovedElement(node);
                }
            }

        }
    }

    /**
     *
     * @param {Element} element
     * @param {DomElementBindingDescription} descriptor
     * @private
     */
    __bind(element, descriptor) {
        const binding = new DomElementBinding();

        binding.element = element;
        binding.description = descriptor;

        const processor = binding.description.processor(element);

        processor.initialize(this);

        binding.processor = processor;

        binding.bind();

        let bindings = this.__element_to_bindings.get(element);

        if (bindings === undefined) {
            bindings = [];

            this.__element_to_bindings.set(element, bindings);
        }

        bindings.push(binding);
    }


    /**
     *
     * @param {Element} element
     * @private
     */
    __handleAttachedElement(element) {
        if (!(element instanceof Element)) {
            return;
        }

        const descriptors = this.__descriptors;

        const n = descriptors.length;

        for (let i = 0; i < n; i++) {
            const descriptor = descriptors[i];

            const selector = descriptor.selector;

            if (element.matches(selector)) {

                this.__bind(element, descriptor);

            }

            const matching_elements = element.querySelectorAll(selector);

            const match_count = matching_elements.length;

            for (let j = 0; j < match_count; j++) {
                const match = matching_elements[j];

                this.__bind(match, descriptor);
            }

        }

    }

    /**
     *
     * @param {Element} element
     * @private
     */
    __handleRemovedElement(element) {
        /**
         *
         * @type {DomElementBinding[]}
         */
        const bindings = this.__element_to_bindings.get(element);

        if (bindings !== undefined) {

            this.__element_to_bindings.delete(element);

            const n = bindings.length;

            for (let i = 0; i < n; i++) {

                const binding = bindings[i];

                binding.unbind();
            }

        }

        const child_nodes = element.children;

        if (child_nodes !== undefined) {

            const child_nodes_count = child_nodes.length;

            for (let i = 0; i < child_nodes_count; i++) {

                const child = child_nodes[i];

                this.__handleRemovedElement(child);

            }

        }

    }

    /**
     *
     * @return {Engine|null}
     */
    getEngine() {
        return this.__engine;
    }

    /**
     *
     * @param {Engine} engine
     */
    initialize(engine) {

        this.__engine = engine;

    }

    /**
     *
     * @param {number} timeDelta in seconds
     * @private
     */
    __handle_frame(timeDelta) {

        this.__element_to_bindings.forEach(this.__handle_frame_entry, this);

    }

    /**
     *
     * @param {DomElementBinding[]} value
     * @param {Element} key
     * @private
     */
    __handle_frame_entry(value, key) {

        const n = value.length;

        for (let i = 0; i < n; i++) {
            const binding = value[i];

            binding.processor.handleFrame();

        }

    }

    link(root) {

        this.__root = root;

        this.__mutation_observer.observe(this.__root, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
            attributeOldValue: false
        });

        this.__handleAttachedElement(root);

        this.getEngine().graphics.on.preRender.add(this.__handle_frame, this);
    }

    unlink() {

        this.__mutation_observer.disconnect();

        this.__root = null;

        this.getEngine().graphics.on.preRender.remove(this.__handle_frame, this);
    }
}
