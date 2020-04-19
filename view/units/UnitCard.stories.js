import { storiesOf } from '@storybook/html';
import { action } from '@storybook/addon-actions';
import UnitCardView from "./UnitCard.js";
import { CombatUnit } from "../../../model/game/ecs/component/unit/CombatUnit.js";
import { Localization } from "../../core/Localization.js";
import CombatUnitDescription from "../../../model/game/logic/combat/unit/CombatUnitDescription.js";
import Team from "../../../model/game/ecs/component/Team.js";

storiesOf('UnitCard', module)
    .add('archer lvl 1', () => {
        const unit = new CombatUnit();

        const d = new CombatUnitDescription();
        d.fromJSON({
            id: 'archer',
            avatarImage: 'data/textures/avatars/v2/male_archer.png'
        });

        unit.description.set(d);

        const localization = new Localization();
        localization.json = {
            'creature.archer.name': 'Archer'
        };

        const cardView = new UnitCardView(unit, {
            localization,
            team: new Team(0),
            handlers: {
                inspectTalents: action('inspect talents')
            }
        });

        cardView.size.set(200, 200);

        cardView.link();

        return cardView.el;
    });
