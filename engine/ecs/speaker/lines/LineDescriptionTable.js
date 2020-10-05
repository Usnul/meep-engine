import { StaticKnowledgeDataTable } from "../../../../../model/game/database/StaticKnowledgeDataTable.js";
import { LineDescription } from "./LineDescription.js";

/**
 * @extends StaticKnowledgeDataTable<LineDescription>
 */
export class LineDescriptionTable extends StaticKnowledgeDataTable {
    parse(json) {
        const r = new LineDescription();

        r.fromJSON(json);

        return r;
    }
}
