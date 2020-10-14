const temp_array = [];

export class LineSetDescription {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.id = "";

        /**
         *
         * @type {LineDescription[]}
         */
        this.lines = [];

        /**
         *
         * @type {LineSetDescription[]}
         */
        this.sets = [];
    }

    /**
     * Collect all lines from this set recursively
     * @param {LineDescription[]} destination
     * @param {number} [destinationOffset]
     */
    collect(destination, destinationOffset = 0) {

        let pointer = 0;
        let added_line_count = 0;

        let destination_offset_pointer = destinationOffset;

        /**
         *
         * @type {LineSetDescription[]}
         */
        const open = temp_array;


        open[pointer++] = this;

        while (pointer > 0) {
            const set = open[--pointer];

            const lines = set.lines;
            const line_count = lines.length;

            for (let i = 0; i < line_count; i++) {
                const line = lines[i];

                // todo consider excluding duplicates
                destination[destination_offset_pointer++] = line;

                added_line_count++;
            }

            const sets = this.sets;
            const set_count = sets.length;


            for (let i = 0; i < set_count; i++) {
                const child = sets[i];

                open[pointer++] = child;
            }

        }

        return added_line_count;
    }
}
