import { assert } from "../../../core/assert.js";
import { Sprite, SpriteMaterial } from "three";
import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import EntityBuilder from "../../../engine/ecs/EntityBuilder.js";
import Renderable from "../../../engine/ecs/components/Renderable.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import { synchronizeTransform } from "./synchronizeTransform.js";
import EditorEntity from "../../ecs/EditorEntity.js";

/**
 * @template C,T
 * @param {Engine} engine
 * @param {string} iconURL
 * @param {C} ComponentClass
 * @returns {ComponentSymbolicDisplay}
 */
export function makePositionedIconDisplaySymbol(engine, iconURL, ComponentClass) {
    assert.defined(engine, 'engine');
    assert.ok(engine.isEngine, 'engine.isEngine');

    const entityManager = engine.entityManager;

    const assetManager = engine.assetManager;

    const spriteMaterial = new SpriteMaterial();
    spriteMaterial.depthTest = false;
    spriteMaterial.transparent = true;
    spriteMaterial.depthWrite = true;

    assetManager.promise(iconURL, 'texture').then(asset => {

        spriteMaterial.map = asset.create();
        spriteMaterial.needsUpdate = true;
    });

    return make3DSymbolicDisplay({
        engine,
        factory([component, transform, entity], api) {

            const entityDataset = entityManager.dataset;

            const b = new EntityBuilder();

            const sprite = new Sprite(spriteMaterial);
            sprite.frustumCulled = false;
            sprite.matrixAutoUpdate = false;
            //draw on top of everything else
            sprite.renderOrder = 9999;

            const cR = new Renderable(sprite);
            const cT = new Transform();


            //sprite size
            cT.scale.set(1, 1, 1);
            cR.boundingBox.setBounds(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5);

            synchronizeTransform(transform, cT, api.bindings, true, false, false);

            b.add(cR);
            b.add(cT);
            b.add(new EditorEntity({ referenceEntity: entity }));

            b.build(entityDataset);

            return b;
        },
        components: [ComponentClass, Transform]
    });
}
