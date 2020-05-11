import { GridCellRuleDecorator } from "./GridCellRuleDecorator.js";

export class GridCellRuleNot extends GridCellRuleDecorator {
    match(data,x,y) {
        return !this.source.match(data,x,y);
    }

    /**
     *
     * @param {GridCellRule} source
     * @return {GridCellRuleNot}
     */
    static from(source) {
        const r = new GridCellRuleNot();

        r.source = source;

        return r;
    }
}
