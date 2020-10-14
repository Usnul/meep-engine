import { StaticKnowledgeDataTable } from "../../../../../../model/game/database/StaticKnowledgeDataTable.js";
import { LineSetDescription } from "./LineSetDescription.js";

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
}
