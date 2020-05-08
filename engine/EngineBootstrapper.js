import LabelView from "../view/common/LabelView.js";
import { FrameRunner } from "./graphics/FrameRunner.js";

/**
 * Used for monitoring progress of the engine startup
 */
export class EngineBootstrapper {

    constructor() {
        /**
         *
         * @type {Node}
         */
        this.rootNode = null;
    }


    /**
     *
     * @param {Engine} engine
     * @returns {Promise}
     */
    boot(engine) {

        const v = new LabelView('Engine initialization');
        v.css({
            color: 'white'
        });
        v.link();

        this.rootNode.appendChild(v.el);

        const started = engine.start();

        const vExecutionEngineState = new LabelView('');
        const vAssetManagerState = new LabelView('');

        v.addChild(vExecutionEngineState);
        v.addChild(vAssetManagerState);

        const frameRunner = new FrameRunner(() => {
            vExecutionEngineState.updateText(`Executor: ${engine.executor.queueReady.length} ready, ${engine.executor.queueUnresolved.length} unresolved`);
            vAssetManagerState.updateText(`Assets: ${engine.assetManager.assets.size} loaded, ${engine.assetManager.requestMap.size} pending`);
        });

        frameRunner.startup();


        started.then(() => {
            frameRunner.shutdown();

            this.rootNode.removeChild(v.el);

            v.unlink();
        });


        return started;
    }
}
