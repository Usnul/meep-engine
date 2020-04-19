import {
    computeTotalTrainableTalentPoints,
    computeUnspentPoints
} from "../../../../model/game/logic/combat/unit/talent/TalentLogic.js";
import BoundedValue from "../../../core/model/BoundedValue.js";

function TalentPointWatch(unit) {
    this.unit = unit;

    const points = new BoundedValue(0, 0);

    /**
     *
     * @type {BoundedValue}
     */
    this.points = points;


    function updatePoints() {
        points.setValue(computeUnspentPoints(unit));
        points.setUpperLimit(computeTotalTrainableTalentPoints(unit));
    }

    this.update = updatePoints;

    this.__handleTalentAdded = function (talent) {
        talent.level.onChanged.add(updatePoints, this);
        updatePoints();
    };

    this.__handleTalentRemoved = function (talent) {
        talent.level.onChanged.remove(updatePoints, this);
        updatePoints();
    };
}

TalentPointWatch.prototype.start = function () {
    this.update();

    this.unit.talents.forEach(this.__handleTalentAdded, this);
    this.unit.talents.on.added.add(this.__handleTalentAdded, this);
    this.unit.talents.on.removed.add(this.__handleTalentRemoved, this);
};

TalentPointWatch.prototype.stop = function () {
    this.unit.talents.forEach(this.__handleTalentRemoved, this);
    this.unit.talents.on.added.remove(this.__handleTalentAdded, this);
    this.unit.talents.on.removed.remove(this.__handleTalentRemoved, this);
};

export default TalentPointWatch;
