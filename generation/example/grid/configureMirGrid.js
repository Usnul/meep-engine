import { GridDataLayer } from "../../grid/layers/GridDataLayer.js";
import { MirGridLayers } from "./MirGridLayers.js";
import { DataType } from "../../../core/collection/table/DataType.js";

/**
 *
 * @param {GridData} data
 */
export function configureMirGrid(data) {

    data.addLayer(GridDataLayer.from(MirGridLayers.Tags, DataType.Uint32, 1));

    data.addLayer(GridDataLayer.from(MirGridLayers.DistanceFromStart, DataType.Uint16, 1));
    data.addLayer(GridDataLayer.from(MirGridLayers.DistanceFromPlayArea, DataType.Uint16, 1));

    data.addLayer(GridDataLayer.from(MirGridLayers.Heights, DataType.Float32, 1));

    data.addLayer(GridDataLayer.from(MirGridLayers.Moisture, DataType.Float32, 1));
}
