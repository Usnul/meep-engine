import { CellMatcherLayerBitMaskTest } from "../../rules/CellMatcherLayerBitMaskTest.js";
import { GridTags } from "../../GridTags.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";

export const matcher_tag_traversable = CellMatcherLayerBitMaskTest.from(GridTags.Traversable, MirGridLayers.Tags);
