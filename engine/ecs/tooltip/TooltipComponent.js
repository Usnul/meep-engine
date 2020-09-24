export class TooltipComponent {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.key = '';
    }

    toJSON() {
        return {
            key: this.key
        };
    }

    fromJSON({ key }) {
        this.key = key;
    }

    static fromJSON(json) {
        const r = new TooltipComponent();

        r.fromJSON(json);

        return r;
    }
}


TooltipComponent.typeName = 'Tooltip';
