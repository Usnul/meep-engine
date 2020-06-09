import { CellFilterAdd } from "../../filtering/math/algebra/CellFilterAdd.js";
import { CellFilterMultiply } from "../../filtering/math/algebra/CellFilterMultiply.js";
import { CellFilterSimplexNoise } from "../../filtering/complex/CellFilterSimplexNoise.js";
import { CellFilterConstant } from "../../filtering/core/CellFilterConstant.js";
import { CellFilterGaussianBlur } from "../../filtering/complex/CellFilterGaussianBlur.js";
import { CellFilterOneMinus } from "../../filtering/math/CellFilterOneMinus.js";
import { CellFilterStep } from "../../filtering/math/CellFilterStep.js";
import { CellFilterReadGridLayer } from "../../filtering/CellFilterReadGridLayer.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";

const fReadHeight = CellFilterReadGridLayer.from(MirGridLayers.Heights);

export const SampleGroundMoistureFilter = CellFilterAdd.from(
    // add regional variation in relative moisture
    CellFilterMultiply.from(
        CellFilterSimplexNoise.from(100, 100),
        CellFilterConstant.from(0.4)
    ),

    //simulate water distribution from lakes/rivers/sees into the nearby ground
    CellFilterMultiply.from(
        CellFilterGaussianBlur.from(
            CellFilterOneMinus.from(
                CellFilterStep.from(CellFilterConstant.from(0), fReadHeight)
            ),
            7,
            7
        ),
        CellFilterConstant.from(0.6)
    )
);
