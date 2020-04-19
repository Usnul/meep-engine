import { assert } from "../../core/assert.js";

class InterfaceCommand {
    /**
     * @param {InteractionCommand} command
     * @param {Object} [style]
     * @param {string} tooltip
     * @param {SoundTrack} [actionSound]
     * @param {SoundTrack} [hoverSound]
     * @constructor
     */
    constructor(
        {
            command,
            style = {},
            tooltip,
            actionSound = null,
            hoverSound = null
        }
    ) {
        assert.notEqual(command, undefined, 'command is undefined');

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
