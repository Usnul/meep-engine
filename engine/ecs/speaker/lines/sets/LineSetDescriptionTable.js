import { StaticKnowledgeDataTable } from "../../../../../../model/game/database/StaticKnowledgeDataTable.js";
import { LineSetDescription } from "./LineSetDescription.js";

/**
 *
 * @param {{id:string}} element
 * @param {Object<{id:string}>} cameFrom
 * @returns {string[]}
 */
function buildPath(element, cameFrom) {

    const result = [];

    let node = element;

    while (node !== undefined) {
        const id = node.id;

        if (result.includes(id)) {
            break;
        }

        result.push(id);

        node = cameFrom[id]
    }

    return result;

}

export class LineSetDescriptionTable extends StaticKnowledgeDataTable {
    parse(json) {
        const r = new LineSetDescription();

        r.id = json.id;

        return r;
    }

    linkOne(element, json, database, assetManager) {

        const lines_table = database.getTable('voice-lines');

        if (lines_table === undefined) {
            throw new Error(`table 'voice-lines' not found`);
        }

        const { lines = [], sets = [] } = json;

        lines_table.getMany(element.lines, lines);
        this.getMany(element.sets, sets);

        return Promise.resolve();
    }

    /**
     *
     * @param {LineSetDescription} element
     * @param database
     * @param errorConsumer
     */
    validateOne(element, database, errorConsumer) {

        // check for circular dependencies
        const visited = {};

        const cameFrom = {};

        /**
         *
         * @type {LineSetDescription[]}
         */
        const open = [element];

        while (open.length > 0) {
            const set = open.pop();

            if (visited.hasOwnProperty(set.id)) {
                errorConsumer(`Circular dependency detected: ${buildPath(set, cameFrom).join(' -> ')}`);
                return false;
            }

            visited[set.id] = true;

            const sets = set.sets;

            const n = sets.length;

            for (let i = 0; i < n; i++) {
                const child = sets[i];

                cameFrom[child.id] = set;

                open.push(child);
            }

        }


        return true;
    }
}
