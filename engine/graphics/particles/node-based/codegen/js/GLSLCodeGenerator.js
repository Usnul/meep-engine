import { CodeGenerator } from "../CodeGenerator.js";
import { CodeContext } from "../CodeContext.js";
import { BitSet } from "../../../../../../core/binary/BitSet.js";

export class GLSLCodeGenerator extends CodeGenerator {
    generate(graph) {

        const open_set = new Set();
        const closed_set = new BitSet();

        const context = new CodeContext();

        // TODO validate graph


        // find nodes that are

        // add all output nodes to open set
    }
}
