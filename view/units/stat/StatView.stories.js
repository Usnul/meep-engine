import { storiesOf } from '@storybook/html';
import { StatView } from "./StatView.js";
import Stat from "../../../core/model/stat/Stat.js";
import { Localization } from "../../../core/Localization.js";
import LinearModifier from "../../../core/model/stat/LinearModifier.js";

function init() {
    const localization = new Localization();
    localization.json = {
        'system_combat_unit_stat.Stat.name': 'Stat'
    };


    return { localization };
}

storiesOf('StatView', module)
    .add('0', () => {
        const options = init();

        const stat = new Stat(0);

        const statView = new StatView(stat, {
            id: 'Stat',
            localization: options.localization
        });

        statView.link();

        return statView.el;
    })
    .add('positive', () => {
        const options = init();

        const stat = new Stat(10);

        stat.addModifier(new LinearModifier(1.7, 42));

        const statView = new StatView(stat, {
            id: 'Stat',
            localization: options.localization
        });

        statView.link();

        return statView.el;
    })
    .add('negative', () => {
        const options = init();

        const stat = new Stat(10);

        stat.postprocess = Stat.Process.clampMin(0);

        stat.addModifier(new LinearModifier(1.7, -42));

        const statView = new StatView(stat, {
            id: 'Stat',
            localization: options.localization
        });

        statView.link();

        return statView.el;
    });
