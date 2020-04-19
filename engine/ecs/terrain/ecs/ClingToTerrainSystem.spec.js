import ClingToTerrainSystem from "./ClingToTerrainSystem.js";
import { EntityManager } from "../../EntityManager.js";
import TransformSystem from "../../systems/TransformSystem.js";


function createEm() {

    const manager = new EntityManager();

    manager.addSystem(new TransformSystem());

    return manager;
}

test('startup finishes successfully', () => {
    const sut = new ClingToTerrainSystem();

    const manager = createEm();

    manager.addSystem(sut);

    return new Promise(function (resolve, reject) {
        manager.startup(resolve, reject);
    })
});


test('shutdown finishes successfully', () => {
    const sut = new ClingToTerrainSystem();

    const manager = createEm();

    manager.addSystem(sut);

    return new Promise(function (resolve, reject) {
        manager.startup(resolve, reject);
    }).then(function () {
        return new Promise(function (resolve, reject) {
            manager.shutdown(resolve, reject);
        });
    });
});
