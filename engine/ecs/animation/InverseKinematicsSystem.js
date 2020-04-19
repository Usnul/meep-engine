import { System } from "../System.js";
import { InverseKinematics } from "./InverseKinematics.js";
import Mesh, { MeshFlags } from "../../graphics/ecs/mesh/Mesh.js";
import { TwoBoneInverseKinematicsSolver } from "./TwoBoneInverseKinematicsSolver.js";
import { extractSkeletonFromMeshComponent } from "../../graphics/ecs/mesh/SkeletonUtils.js";
import { obtainTerrain } from "../../../../model/game/scenes/SceneUtils.js";
import { OneBoneSurfaceAlignmentSolver } from "./OneBoneSurfaceAlignmentSolver.js";
import { IKProblem } from "./IKProblem.js";


export class InverseKinematicsSystem extends System {
    constructor() {
        super();

        this.componentClass = InverseKinematics;
        this.dependencies = [InverseKinematics, Mesh];

        /**
         *
         * @type {{"2BIK": TwoBoneInverseKinematicsSolver}}
         */
        this.solvers = {
            "2BIK": new TwoBoneInverseKinematicsSolver(),
            "1BSA": new OneBoneSurfaceAlignmentSolver()
        };

        this.problems = {};

        /**
         *
         * @type {Terrain}
         */
        this.__terrain = null;
    }

    /**
     *
     * @param {InverseKinematics} ik
     * @param {Mesh} mesh
     */
    recordEntityProblems(ik, mesh) {

        if (!mesh.getFlag(MeshFlags.InView)) {
            //not visible
            return;
        }

        const skeleton = extractSkeletonFromMeshComponent(mesh);

        if (skeleton === null) {
            return;
        }

        const ikConstraints = ik.constraints;

        const n = ikConstraints.length;

        for (let i = 0; i < n; i++) {
            /**
             *
             * @type {IKConstraint}
             */
            const c = ikConstraints[i];

            const solverID = c.solver;

            //define problem
            const problem = IKProblem.pool.create();
            problem.constraint = c;
            problem.skeleton = skeleton;
            problem.terrain = this.__terrain;

            const problemSet = this.problems[solverID];

            if (problemSet === undefined) {
                this.problems[solverID] = [problem];
            } else {
                problemSet.push(problem);
            }
        }

    }

    update(timeDelta) {


        const em = this.entityManager;

        const ecd = em.dataset;

        if (ecd == null) {
            return;
        }

        this.__terrain = obtainTerrain(ecd);

        if (this.__terrain === null) {
            return;
        }


        ecd.traverseEntities([InverseKinematics, Mesh], this.recordEntityProblems, this);

        //solve problems
        for (const solverID in this.solvers) {
            const problemSet = this.problems[solverID];

            if (problemSet === undefined) {
                continue;
            }

            const n = problemSet.length;

            if (n === 0) {
                continue;
            }

            const solver = this.solvers[solverID];

            for (let i = 0; i < n; i++) {
                const problem = problemSet[i];

                try {
                    solver.solve(problem);
                } catch (e) {
                    console.error("Solution failed:", e);
                }

                IKProblem.pool.release(problem);
            }
        }

        //clear problem set
        for (const solverID in this.problems) {
            const problemSet = this.problems[solverID];

            problemSet.splice(0, problemSet.length);
        }
    }
}
