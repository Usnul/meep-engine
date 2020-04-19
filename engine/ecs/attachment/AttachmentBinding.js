export class AttachmentBinding {
    constructor() {
        this.attachedEntity = -1;

        /**
         *
         * @type {Transform}
         */
        this.attachedTransform = null;


        this.parentEntity = -1;

        /**
         *
         * @type {Transform}
         */
        this.parentTransform = null;

        /**
         *
         * @type {AttachmentSocket}
         */
        this.socket = null;

        /**
         *
         * @type {Attachment}
         */
        this.attachment = null;
    }

    update() {

    }
}
