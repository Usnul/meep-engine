/**
 * User: Alex Goldring
 * Date: 21/6/2014
 * Time: 14:56
 */
import { System } from '../System.js';
import Timer from '../components/Timer.js';


class TimerSystem extends System {
    constructor() {
        super();
        this.componentClass = Timer;

        this.dependencies = [Timer];
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const dataset = entityManager.dataset;

        if (dataset === null) {
            return;
        }

        dataset.traverseComponents(Timer, function (timer, entity) {
            if (!timer.active) {
                return;
            }

            let budget = timer.counter + timeDelta;
            const timeout = timer.timeout;

            while (budget > timeout) {
                budget -= timeout;

                const functions = timer.actions;

                const n = functions.length;

                for (let i = 0; i < n; i++) {
                    const action = functions[i];

                    try {
                        action();
                    } catch (e) {
                        console.error(`entity '${entity}' Timer action[${i}] exception:`, e);
                    }

                }

                functions.forEach(function (action) {
                    action();
                });

                entityManager.sendEvent(entity, "timer-timeout", timer);
                if (++timer.ticks > timer.repeat) {
                    //already performed too many cycles
                    timer.active = false;
                    return; //bail out
                }

                if (timeout === 0) {
                    // prevent infinite loop
                    break;
                }
            }
            timer.counter = budget;

        });

    }
}


export default TimerSystem;
