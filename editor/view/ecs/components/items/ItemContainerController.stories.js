import { storiesOf } from "@storybook/html/dist/client/preview";
import { Localization } from "../../../../../core/Localization.js";
import { ItemContainerController } from "./ItemContainerController.js";
import ItemContainer from "../../../../../../model/game/ecs/component/ItemContainer.js";
import Item from "../../../../../../model/game/ecs/component/Item.js";
import { EngineHarness } from "../../../../../engine/EngineHarness.js";
import { assert } from "../../../../../core/assert.js";

const enginePromise = EngineHarness.getSingleton()
    .initialize();

enginePromise.then(engine => {

    engine.gameView.el.style.visibility = 'hidden';
});

storiesOf("ItemContainerController", module)
    .add('Basic', () => {
        const localization = new Localization();

        const icv = new ItemContainerController({ localization });

        icv.link();

        enginePromise.then(engine => {
            icv.itemDatabase = engine.staticKnowledge.items;

            const itemContainer = new ItemContainer();

            itemContainer.random.set(1, 2);

            const id = 'potion_of_major_knowledge';
            const itemDescription = engine.staticKnowledge.items.get(id);

            assert.notEqual(itemDescription, null, `item '${id}' not found`);

            const item = new Item();

            item.description = itemDescription;
            item.count.set(3);


            itemContainer.items.add(item);

            icv.model.set(itemContainer);
        });


        return icv.el;
    });
