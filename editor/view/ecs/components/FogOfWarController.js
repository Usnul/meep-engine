import DatGuiController from "./DatGuiController.js";
import { clear } from "../../../../view/controller/dat/DatGuiUtils.js";
import ButtonView from "../../../../view/elements/button/ButtonView.js";
import { FogOfWarRevealer } from "../../../../engine/ecs/fow/FogOfWarRevealer.js";

export class FogOfWarController extends DatGuiController {
    /**
     * @param {EntityManager} em
     * @constructor
     */
    constructor(em) {
        super();

        const self = this;

        this.addChild(new ButtonView({
            action() {
                /**
                 *
                 * @type {FogOfWar}
                 */
                const fow = self.model.getValue();

                fow.clear();

                /**
                 *
                 * @type {FogOfWarRevealerSystem}
                 */
                const revealerSystem = em.getOwnerSystemByComponentClass(FogOfWarRevealer);

                if (revealerSystem !== undefined) {
                    revealerSystem.forceUpdate();
                }
            },
            name: 'Conceal All'
        }));

        this.addChild(new ButtonView({
            action() {
                /**
                 *
                 * @type {FogOfWar}
                 */
                const fow = self.model.getValue();

                fow.revealAll();

                /**
                 *
                 * @type {FogOfWarRevealerSystem}
                 */
                const revealerSystem = em.getOwnerSystemByComponentClass(FogOfWarRevealer);

                if (revealerSystem !== undefined) {
                    revealerSystem.forceUpdate();
                }
            },
            name: 'Reveal All'
        }));

        /**
         *
         * @param {FogOfWar} model
         */
        function setModel(model) {
            const gui = self.gui;
            clear(gui);

            if (model !== null) {


            }
        }

        this.model.onChanged.add(setModel);
    }
}
