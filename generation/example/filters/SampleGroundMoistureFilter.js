import { CellFilterAdd } from "../../filtering/math/algebra/CellFilterAdd.js";
import { CellFilterMultiply } from "../../filtering/math/algebra/CellFilterMultiply.js";
import { CellFilterSimplexNoise } from "../../filtering/complex/CellFilterSimplexNoise.js";
import { CellFilterConstant } from "../../filtering/core/CellFilterConstant.js";
import { CellFilterGaussianBlur } from "../../filtering/complex/CellFilterGaussianBlur.js";
import { CellFilterOneMinus } from "../../filtering/math/CellFilterOneMinus.js";
import { CellFilterSmoothStep } from "../../filtering/math/CellFilterSmoothStep.js";
import { CellFilterAngleToNormal } from "../../filtering/complex/CellFilterAngleToNormal.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { CellFilterStep } from "../../filtering/math/CellFilterStep.js";
import { CellFilterReadGridLayer } from "../../filtering/CellFilterReadGridLayer.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";

const fReadHeight = CellFilterReadGridLayer.from(MirGridLayers.Heights);

export const SampleGroundMoistureFilter =  CellFilterAdd.from(
    // add regional variation in relative moisture
    CellFilterMultiply.from(
        CellFilterSimplexNoise.from(100, 100),
        CellFilterConstant.from(0.2)
    ),

    CellFilterAdd.from(
        //simulate water accumulation from precipitation
        CellFilterMultiply.from(
            CellFilterGaussianBlur.from(
                CellFilterOneMinus.from(
                    CellFilterSmoothStep.from(
                        CellFilterConstant.from(0),
                        CellFilterConstant.from(Math.PI / 2),
                        CellFilterAngleToNormal.from(fReadHeight, Vector3.forward)
                    )
                ),
                2,
                2
            ),
            CellFilterConstant.from(0.3)
        ),
        //simulate water distribution from lakes/rivers/sees into the nearby ground
        CellFilterMultiply.from(
            CellFilterGaussianBlur.from(
                CellFilterOneMinus.from(
                    CellFilterStep.from(CellFilterConstant.from(0), fReadHeight)
                ),
                5,
                5
            ),
            CellFilterConstant.from(0.5)
        )
    )
);
