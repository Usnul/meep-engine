import { CodeGenerator } from "../CodeGenerator.js";
import { CodeContext } from "../CodeContext.js";
import { BitSet } from "../../../../../../core/binary/BitSet.js";
import { PortDirection } from "../../../../../../core/model/node-graph/node/PortDirection.js";
import LineBuilder from "../../../../../../core/codegen/LineBuilder.js";
import { ParticleDataTypes } from "../../nodes/ParticleDataTypes.js";
import { assert } from "../../../../../../core/assert.js";
import { genAttributeInputName } from "./genAttributeInputName.js";
import { genAttributeOutputName } from "./genAttributeOutputName.js";

/**
 *
 * @param {ParticleDataTypes} type
 * @returns {string}
 */
function genTypeSpecifier(type) {

    switch (type) {
        case ParticleDataTypes.Color:
        case ParticleDataTypes.Vector4:
            return 'vec4';
        case ParticleDataTypes.Vector3:
            return 'vec3';
        case ParticleDataTypes.Vector2:
            return 'vec2';
        case ParticleDataTypes.Float:
            return 'float';
        default:
            throw new Error(`Unsupported data type '${type}'`);
    }
}

/**
 *
 * @param {string} name
 * @param {ParticleDataTypes} type
 * @returns {string}
 */
function genVarDeclaration(name, type) {
    assert.typeOf(name, 'string', 'name');

    return `${genTypeSpecifier(type)} ${name}`;
}

/**
 *
 * @param {CodeContext} context
 * @param {LineBuilder} output
 * @param {ParticleDataTypes} type
 */
function initializeDefaultValue(context, output, type) {

    const id = context.identifier();

    output.add(`${genVarDeclaration(id, type)};`);

    return id;
}


/**
 *
 * @type {Connection[]}
 */
const temp_connections = [];

export class GLSLCodeGenerator extends CodeGenerator {
    generate(graph, attributes, uniforms) {

        /**
         *
         * @type {Set<NodeInstance>}
         */
        const open_set = new Set();
        const closed_set = new BitSet();

        const context = new CodeContext();

        // TODO validate graph

        const out_preamble = new LineBuilder();
        out_preamble.add('#version 300 es');
        out_preamble.add('precision highp float;');

        // declare attributes
        attributes.forEach(attribute => {
            out_preamble.add(`in ${genTypeSpecifier(attribute.type)} ${genAttributeInputName(attribute)};`);
            out_preamble.add(`out ${genTypeSpecifier(attribute.type)} ${genAttributeOutputName(attribute)};`);
        });

        // declare uniforms
        uniforms.forEach(element => {
            out_preamble.add(`uniform ${genTypeSpecifier(element.type)} ${element.name};`);
        });

        const out_main_body = new LineBuilder();

        // add all output nodes to open set
        graph.traverseNodes(open_set.add, open_set);

        while (open_set.size > 0) {

            const trash = [];


            open_set_loop:for (const instance of open_set) {

                /**
                 *
                 * @type {List<Connection>}
                 */
                const connection_count = graph.getConnectionsAttachedToNode(instance.id, temp_connections);

                // gather output port variable names
                const port_variables = [];

                for (let i = 0; i < connection_count; i++) {

                    const connection_id = temp_connections[i];

                    /**
                     *
                     * @type {Connection}
                     */
                    const connection = graph.getConnection(connection_id);

                    if (connection.target.instance === instance && connection.target.port.direction === PortDirection.In) {
                        if (closed_set.get(connection.source.instance.id)) {
                            port_variables[connection.target.port.id] = context.getIdentifier(connection.source.instance, connection.source.port);

                        } else {

                            // input not satisfied
                            continue open_set_loop;
                        }
                    } else if (connection.source.instance === instance && connection.source.port.direction === PortDirection.In) {
                        if (closed_set.get(connection.target.instance.id)) {
                            port_variables[connection.source.port.id] = context.getIdentifier(connection.target.instance, connection.target.port);
                        } else {

                            // input not satisfied
                            continue open_set_loop;
                        }
                    }

                }

                // create variables for all outputs
                const nodeDescription = instance.description;
                const ports = nodeDescription.getPorts();

                for (let i = 0; i < ports.length; i++) {
                    const port = ports[i];

                    if (port.direction === PortDirection.Out) {
                        const identifier = context.getIdentifier(instance, port);

                        port_variables[port.id] = identifier;

                        out_main_body.add(`${genVarDeclaration(identifier, port.dataType)};`);

                    } else if (port_variables[port.id] === undefined) {

                        // no input, lets create one
                        port_variables[port.id] = initializeDefaultValue(context, out_main_body, port.dataType);
                    }
                }

                // all connections are satisfied, lets materialize the node
                trash.push(instance);
                closed_set.set(instance.id, true);

                //
                nodeDescription.generate_glsl(instance, out_main_body, context, port_variables);
            }

            if (trash.length === 0) {
                // no nodes materialized, can't proceed with the generation
                throw new Error(`No more nodes could be materialized`);
            }

            for (let i = 0; i < trash.length; i++) {
                const instance = trash[i];

                open_set.delete(instance);
            }
        }

        const b = new LineBuilder();

        b.addLines(out_preamble);
        b.add('void  main(){');
        b.indent();
        b.addLines(out_main_body);
        b.dedent();
        b.add('}');

        return b.build();
    }
}
