import { CellMatcherLayerBitMaskTest } from "../../rules/CellMatcherLayerBitMaskTest.js";
import { GridTags } from "../../GridTags.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";

export const matcher_play_area = CellMatcherLayerBitMaskTest.from(GridTags.PlayArea, MirGridLayers.Tags);
