import { storiesOf } from '@storybook/html';
import { Localization } from "../../../core/Localization.js";
import { CombatUnitStatsView } from "./CombatUnitStatsView.js";
import { CombatUnit } from "../../../../model/game/ecs/component/unit/CombatUnit.js";
import CombatUnitDescription from "../../../../model/game/logic/combat/unit/CombatUnitDescription.js";
import { DomTooltipManager } from "../../tooltip/DomTooltipManager.js";
import { TooltipManager } from "../../tooltip/TooltipManager.js";
import { PointerDevice } from "../../../engine/input/devices/PointerDevice.js";
import { GMLEngine } from "../../tooltip/GMLEngine.js";
import { StaticKnowledgeDatabase } from "../../../../model/game/database/StaticKnowledgeDatabase.js";
import LinearModifier from "../../../core/model/stat/LinearModifier.js";

function init() {

    const localization = new Localization();
    localization.json = {
        'system_combat_unit_stat.Stat.name': 'Stat',
        'system_combat_unit_stat.experience.name': 'Experience',
        'system_combat_unit_stat.health.name': 'Health',
        'system_combat_unit_stat.abilityPower.name': 'Ability Power',
        'system_combat_unit_stat.abilityType.name': 'Ability Type',
        'system_combat_unit_stat.targetDescription.name': 'Target',
        'system_combat_unit_stat.armor.name': 'Armor',
        'system_combat_unit_stat.absorption.name': 'Absorption',
        'system_combat_unit_stat.initiative.name': 'Initiative',
        'system_combat_unit_stat.armorPiercing.name': 'Armor Piercing',
        'system_combat_unit_stat.absorptionPiercing.name': 'Absorption Piercing',
        'system_combat_unit_stat.lifeSteal.name': 'Life Stealing',

        'system_combat_unit_ability_type.attack.name': 'Attack',
        'system_combat_unit_ability_target_description_melee': 'Melee',
        'system_combat_unit_ability_target_description_enemy': 'Enemy',

        'system_combat_unit_stat.lifeSteal.tip': 'Life Steal',
        'system_combat_unit_stat.absorptionPiercing.tip': 'Absorption Piercing',
        'system_combat_unit_stat.armorPiercing.tip': 'Armor Piercing',
        'system_combat_unit_stat.initiative.tip': 'Initiative',
        'system_combat_unit_stat.absorption.tip': 'Absorption',
        'system_combat_unit_stat.armor.tip': 'Armor',
        'system_combat_unit_stat.targetDescription.tip': 'Target',
        'system_combat_unit_stat.abilityType.tip': 'Ability Type',
        'system_combat_unit_stat.abilityPower.tip': 'Ability Power',
        'system_combat_unit_stat.health.tip': 'Health',
        'system_combat_unit_stat.experience.tip': 'Experience',


        'system_combat_unit_stat.healingEffectiveness.name': 'Healing Effectiveness',
        'system_combat_unit_stat.healingEffectiveness.tip': 'Determines how well healing works on the unit',

        'system_combat_unit_stat.healthMax.name': 'Maximum Health',
        'system_combat_unit_stat.healthMax.tip': 'Maximum possible amount of health unit can have, current health of the unit can not exceed this amount',
    };


    const udA = new CombatUnitDescription();
    udA.fromJSON({
        id: 'a',
        armor: '50',
        absorptionPiercing: 100,
        armorPiercing: 100,
        absorption:100
    });

    const database = new StaticKnowledgeDatabase();

    database.units.add(udA);

    const pointerDevice = new PointerDevice(document);
    pointerDevice.start();

    const gml = new GMLEngine();
    gml.initialize(database, localization);

    const tooltipManager = new TooltipManager();
    tooltipManager.initialize(gml, pointerDevice);

    tooltipManager.startup();
    document.body.appendChild(tooltipManager.contextView.el);

    tooltipManager.contextView.size.set(window.innerWidth, window.innerHeight);
    tooltipManager.contextView.link();

    const domTooltipManager = new DomTooltipManager(tooltipManager);

    return {
        localization,
        database,
        tooltips: domTooltipManager,
        tooltipManager,
    };
}

storiesOf('CombatUnitStatsView', module)
    .add('basic', () => {
        const { localization, database, tooltips } = init();

        const unit = new CombatUnit();

        unit.description.set(database.units.get('a'));


        unit.stats.abilityPower.addModifier(new LinearModifier(1.2, 5));
        unit.stats.armor.addModifier(new LinearModifier(1, -7));
        unit.stats.initiative.addModifier(new LinearModifier(0.9, -7.5));
        unit.stats.absorption.addModifier(new LinearModifier(0.2, -7));
        unit.stats.absorption.addModifier(new LinearModifier(0.2, -7));
        unit.stats.absorptionPiercing.addModifier(new LinearModifier(1.56, 0));
        unit.stats.armorPiercing.addModifier(new LinearModifier(2.1, 0));
        unit.stats.healthMax.addModifier(new LinearModifier(1, 20));

        const view = new CombatUnitStatsView(unit, { localization, tooltip: tooltips });

        view.link();

        return view.el;
    });
