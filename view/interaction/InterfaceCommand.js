import { assert } from "../../core/assert.js";

class InterfaceCommand {
    /**
     * @param {InteractionCommand} command
     * @param {string} [name]
     * @param {Object} [style]
     * @param {string} [tooltip]
     * @param {SoundTrack} [actionSound]
     * @param {SoundTrack} [hoverSound]
     * @param {string[]} [tags]
     * @constructor
     */
    constructor(
        {
            command,
            style = {},
            tooltip,
            name = "",
            actionSound = null,
            hoverSound = null,
            tags = []
        }
    ) {
        assert.defined(command, 'command');

        /**
         * Name for the command, this is a localization key
         * @type {string}
         */
        this.name = name;

        /**
         *
         * @type {InteractionCommand}
         */
        this.command = command;

        /**
         *
         * @type {Object}
         */
        this.style = style;

        /**
         *
         * @type {SoundTrack}
         */
        this.actionSound = actionSound;

        /**
         *
         * @type {SoundTrack}
         */
        this.hoverSound = hoverSound;

        /**
         * Localization key for the tooltip
         * @type {string}
         */
        this.tooltip = tooltip;

        /**
         *
         * @type {string[]}
         */
        this.tags = tags;
    }

    /**
     *
     * @param {InteractionCommand} command
     * @param {Object} [style]
     * @param {SoundTrack} [actionSound]
     * @param {SoundTrack} [hoverSound]
     * @param {string} [tooltip]
     * @param {string[]} [tags]
     */
    static form(
        {
            command,
            style = {},
            actionSound = null,
            hoverSound = null,
            tooltip,
            tags = []
        }
    ) {

        this.command = command;

        this.style = style;

        this.actionSound = actionSound;

        this.hoverSound = hoverSound;

        this.tooltip = tooltip;

        this.tags = tags;
    }

    /**
     *
     * @param {string} tag
     * @return {boolean}
     */
    hasTag(tag) {
        return this.tags.indexOf(tag) !== -1;
    }

    /**
     * @deprecated
     * @return {string}
     */
    get id() {
        return this.command.id;
    }

    /**
     * @deprecated
     * @return {ObservedBoolean|ReactiveExpression}
     */
    get enabled() {
        return this.command.enabled;
    }

    /**
     * @deprecated
     * @return {List<String>}
     */
    get features() {
        return this.command.features;
    }

    /**
     * @deprecated
     * @return {Function}
     */
    get action() {
        return this.command.action;
    }
}

export default InterfaceCommand;
