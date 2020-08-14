import { CellFilterAdd } from "../../filtering/numeric/math/algebra/CellFilterAdd.js";
import { CellFilterMultiply } from "../../filtering/numeric/math/algebra/CellFilterMultiply.js";
import { CellFilterSimplexNoise } from "../../filtering/numeric/complex/CellFilterSimplexNoise.js";
import { CellFilterLiteralFloat } from "../../filtering/numeric/CellFilterLiteralFloat.js";
import { CellFilterGaussianBlur } from "../../filtering/numeric/complex/CellFilterGaussianBlur.js";
import { CellFilterOneMinus } from "../../filtering/numeric/math/CellFilterOneMinus.js";
import { CellFilterStep } from "../../filtering/numeric/math/CellFilterStep.js";
import { CellFilterReadGridLayer } from "../../filtering/numeric/CellFilterReadGridLayer.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";

const fReadHeight = CellFilterReadGridLayer.from(MirGridLayers.Heights);

export const SampleGroundMoistureFilter = CellFilterAdd.from(
    // add regional variation in relative moisture
    CellFilterMultiply.from(
        CellFilterSimplexNoise.from(100, 100),
        CellFilterLiteralFloat.from(0.4)
    ),

    //simulate water distribution from lakes/rivers/sees into the nearby ground
    CellFilterMultiply.from(
        CellFilterGaussianBlur.from(
            CellFilterOneMinus.from(
                CellFilterStep.from(CellFilterLiteralFloat.from(0), fReadHeight)
            ),
            7,
            7
        ),
        CellFilterLiteralFloat.from(0.6)
    )
);
