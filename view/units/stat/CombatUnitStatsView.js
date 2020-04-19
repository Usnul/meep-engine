import View from "../../View.js";
import { camelToKebab, capitalize } from "../../../core/primitives/strings/StringUtils.js";
import ObservedString from "../../../core/model/ObservedString.js";
import LabeledValueView from "../../elements/label/LabeledValueView.js";
import { StatValueView } from "./StatValueView.js";
import { SimpleStatValueView } from "./SimpleStatValueView.js";
import { computeArmorDamageReductionMultiplier } from "../../../../model/game/logic/combat/CombatAttack.js";
import { CombatUnitStatGroupView } from "./CombatUnitStatGroupView.js";


/**
 *
 * @param {CombatUnit} unit
 * @param {Localization} localization
 * @returns {string}
 */
function buildAbilityTargetText(unit, localization) {
    const unitDescription = unit.description.getValue();

    const result = [];
    const many = !unitDescription.abilityTargetSingle;

    if (many) {
        result.push(localization.getString('system_combat_unit_ability_target_description_multi_target'));
    }

    if (unitDescription.abilityTargetRespectCover) {
        result.push(localization.getString('system_combat_unit_ability_target_description_melee'));
    }

    const targetTypes = [];

    if (unitDescription.targetAllowDead) {
        targetTypes.push(localization.getString('system_combat_unit_ability_target_description_dead'));
    }

    if (unitDescription.targetAllowEmpty) {
        targetTypes.push(localization.getString('system_combat_unit_ability_target_description_empty_tiles'));
    }

    if (unitDescription.targetAllowEnemies) {
        const tag = many ? "system_combat_unit_ability_target_description_enemies" : "system_combat_unit_ability_target_description_enemy";

        targetTypes.push(localization.getString(tag));
    }

    if (unitDescription.targetAllowFriends) {
        const tag = many ? "system_combat_unit_ability_target_description_allies" : "system_combat_unit_ability_target_description_ally";

        targetTypes.push(localization.getString(tag));
    }

    result.push(targetTypes.join(', '));

    result[0] = capitalize(result[0]);
    return result.join(" ");
}

function statViewFactory(stat, unit, { id, localization, gml }) {
    return new SimpleStatValueView(stat, { unit });
}

function statValueTooltip(stat) {
    return new StatValueView(stat);
}


/**
 *
 * @param {string} id
 * @param {string} [unit]
 */
function makeStatDefinition(id, unit) {
    return {
        klass: camelToKebab(id),
        name: `system_combat_unit_stat.${id}.name`,
        tooltip: `system_combat_unit_stat.${id}.tip`,
        tooltipSeed: {},
        valueFactory: function (unit) {
            return unit.stats[id];
        },
        valueTooltip: statValueTooltip,
        valueViewFactory: statViewFactory,
        unit
    };
}

const statsDefinitions = {
    experience: {
        klass: 'experience',
        name: 'system_combat_unit_stat.experience.name',
        tooltip: 'system_combat_unit_stat.experience.tip',
        valueFactory: function (unit) {
            return unit.experience;
        }
    },
    health: {
        klass: 'health',
        name: 'system_combat_unit_stat.health.name',
        tooltip: 'system_combat_unit_stat.health.tip',
        valueFactory: function (unit) {
            return [unit.healthCurrent, unit.stats.healthMax];
        }
    },
    abilityType: {
        klass: 'ability-type',
        name: 'system_combat_unit_stat.abilityType.name',
        tooltip: 'system_combat_unit_stat.abilityType.tip',
        valueFactory: function (unit, localization) {
            return localization.getString(`system_combat_unit_ability_type.${unit.getAbilityType()}.name`);
        }
    },
    target: {
        klass: 'target',
        name: 'system_combat_unit_stat.targetDescription.name',
        tooltip: 'system_combat_unit_stat.targetDescription.tip',
        valueFactory: function (unit, localization) {
            const result = new ObservedString("");

            unit.description.process(function () {
                result.set(buildAbilityTargetText(unit, localization));
            });

            return result;
        }
    },
    armor: (() => {
        const def = makeStatDefinition('armor');

        /**
         *
         * @param {CombatUnit} unit
         */
        function tooltipSeed(unit) {
            const armor = unit.stats.armor.getValue();

            const armorMultiplier = computeArmorDamageReductionMultiplier(armor);

            return {
                reduction: Math.floor((1 - armorMultiplier) * 100)
            };
        }


        def.tooltipSeed = tooltipSeed;

        return def;
    })(),
    absorption: makeStatDefinition('absorption'),
    initiative: makeStatDefinition('initiative'),
    armorPiercing: makeStatDefinition('armorPiercing'),
    absorptionPiercing: makeStatDefinition('absorptionPiercing'),
    lifeSteal: makeStatDefinition('lifeSteal'),
    abilityPower: makeStatDefinition('abilityPower'),
    healthMax: makeStatDefinition('healthMax'),
    healingEffectiveness: makeStatDefinition('healingEffectiveness'),
    healingBonus: makeStatDefinition('healingBonus'),
    experienceModifier: makeStatDefinition('experienceModifier'),
    magicFind: makeStatDefinition('magicFind')
};

/**
 *
 * @param {string} name
 * @param {CombatUnit} unit
 * @param {Localization} localization
 * @param {DomTooltipManager} tooltip
 * @returns {LabeledValueView}
 */
function buildStat(name, unit, localization, tooltip) {
    const statsDefinition = statsDefinitions[name];

    if (statsDefinition === undefined) {
        throw new Error(`No stat definition for stat name '${name}'`);
    }

    const sName = localization.getString(statsDefinition.name);

    const statValue = statsDefinition.valueFactory(unit, localization);

    const vf = statsDefinition.valueViewFactory;

    let valueViewFactory;

    if (vf !== undefined) {
        valueViewFactory = function (v) {
            const gml = tooltip.getTipManager().getGML();
            return vf(v, statsDefinition.unit, { id: name, localization, gml: gml });
        };
    }

    const result = new LabeledValueView({
        klass: statsDefinition.klass,
        label: sName,
        value: statValue,
        unit: statsDefinition.unit,
        valueViewFactory
    });

    result.addClass(`stat-${name}`);

    tooltip.add(result.vLabel, function () {
        let seed = {};

        const tooltipSeed = statsDefinition.tooltipSeed;

        if (typeof tooltipSeed === "function") {
            seed = tooltipSeed(unit);
        } else if (typeof tooltipSeed === "object") {
            seed = tooltipSeed;
        }

        return localization.getString(statsDefinition.tooltip, seed);
    });

    if (statsDefinition.valueTooltip !== undefined) {
        tooltip.add(result.vValue, function () {
            return statsDefinition.valueTooltip(statValue);
        });
    }


    return result;
}

const STAT_GROUPS = [
    ['abilityType', 'abilityPower', 'target'],
    ['armor', 'absorption', 'health'],
    ['initiative', 'armorPiercing', 'absorptionPiercing'],
    ['healthMax', 'healingEffectiveness', 'healingBonus', 'lifeSteal'],
    ['experience', 'experienceModifier', "magicFind"],
];

/**
 * @extends View
 */
export class CombatUnitStatsView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param {Localization} localization
     * @param {DomTooltipManager} tooltip
     * @param {string[]} [stats]
     * @param {[]} [groups]
     */
    constructor(
        unit,
        {
            localization,
            tooltip,
            stats = [
                'experience',
                'experienceModifier',
                'target',
                'abilityType',
                'abilityPower',
                'armor',
                'absorption',
                'initiative',
                'armorPiercing',
                'absorptionPiercing',
                'lifeSteal',
                'health',
                'healthMax',
                'healingEffectiveness',
                'healingBonus',
                'magicFind'
            ],
            groups = STAT_GROUPS
        }
    ) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-combat-unit-stats-view');

        groups
            .map(group => group.filter(s => stats.includes(s)))
            .filter(group => group.length > 0)
            .forEach(group => {
                const statGroupView = new CombatUnitStatGroupView();

                this.addChild(statGroupView);

                group.forEach(statName => {
                    const statView = buildStat(statName, unit, localization, tooltip);

                    statGroupView.addChild(statView);
                })
            });
    }
}
