import { RenderGraph } from "./RenderGraph.js";
import { RenderProgramDefinition } from "./node/RenderProgramDefinition.js";
import { ProgramValueSlotDefinition } from "./slot/ProgramValueSlotDefinition.js";
import { ProgramValueDirectionKind } from "./slot/ProgramValueDirectionKind.js";
import { ProgramValueType } from "./slot/ProgramValueType.js";

export function buildRenderGraph() {
    const graph = new RenderGraph();

    const outDepth = new ProgramValueSlotDefinition({
        name: 'output',
        direction: ProgramValueDirectionKind.Out,
        type: ProgramValueType.FrameBuffer
    });

    const outColor = new ProgramValueSlotDefinition({
        name: 'output',
        direction: ProgramValueDirectionKind.Out,
        type: ProgramValueType.FrameBuffer
    });

    const pColor = new RenderProgramDefinition();
    pColor.slots.push(outColor);

    const pDepth = new RenderProgramDefinition();
    pDepth.slots.push(outDepth);

    const piColor = graph.createNode(pColor);
    const piDepth = graph.createNode(pDepth);


}
