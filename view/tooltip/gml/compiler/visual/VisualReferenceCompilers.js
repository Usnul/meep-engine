import { compileReferenceAction } from "./compileReferenceAction.js";
import { compileReferenceCreature } from "./compileReferenceCreature.js";
import { compileReferenceMoney } from "./compileReferenceMoney.js";
import { compileReferenceStat } from "./compileReferenceStat.js";
import { compileReferenceTalent } from "./compileReferenceTalent.js";
import { compileReferenceAffliction } from "./compileReferenceAffliction.js";
import { compileReferenceItem } from "./compileReferenceItem.js";
import { compileReferenceAbility } from "./compileReferenceAbility.js";

export const VisualReferenceCompilers = {
    ability: compileReferenceAbility,
    item: compileReferenceItem,
    affliction: compileReferenceAffliction,
    talent: compileReferenceTalent,
    action: compileReferenceAction,
    creature: compileReferenceCreature,
    stat: compileReferenceStat,
    money: compileReferenceMoney
};
