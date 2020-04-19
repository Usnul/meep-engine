export class TileMoveProgram {
    constructor() {
        /**
         *
         * @type {TileMoveInstruction[]}
         */
        this.instructions = [];
    }

    /**
     *
     * @param {TileMoveInstruction} instruction
     */
    add(instruction) {
        this.instructions.push(instruction);
    }

    /**
     *
     * @param {Rectangle} tile
     * @returns {boolean}
     */
    hasInstructionForTile(tile) {
        const instructions = this.instructions;
        const n = instructions.length;

        for (let i = 0; i < n; i++) {
            const instruction = instructions[i];

            if (instruction.tile === tile) {
                return true;
            }
        }

        return false;
    }

    /**
     * returns {boolean}
     */
    validate() {

        const instructions = this.instructions;

        const n = instructions.length;

        for (let i = 0; i < n; i++) {
            const instruction = instructions[i];

            if (!instruction.validate()) {
                return false;
            }
        }

        return true;
    }

    execute() {
        const instructions = this.instructions;

        const n = instructions.length;

        for (let i = 0; i < n; i++) {
            const instruction = instructions[i];

            instruction.execute();
        }
    }
}
