import { EntityComponentDataset } from "./EntityComponentDataset.js";
import { EventType } from "./EntityManager.js";
import { EntityObserver } from "./EntityObserver.js";
import { noop } from "../../core/function/Functions.js";

class DummyComponentA {
}

DummyComponentA.typeName = "DummyComponentA";

class DummyComponentB {
}

DummyComponentB.typeName = "DummyComponentB";

test("constructor doesn't throw", () => {
    new EntityComponentDataset();
});

test("create empty entity", () => {
    const dataset = new EntityComponentDataset();
    const entity = dataset.createEntity();

    expect(dataset.entityExists(entity)).toBe(true);
});


test("create empty entity then destroy", () => {
    const dataset = new EntityComponentDataset();
    const entity = dataset.createEntity();

    expect(dataset.entityExists(entity)).toBe(true);

    dataset.removeEntity(entity);

    expect(dataset.entityExists(entity)).toBe(false);
});

test("onEntityCreated signal", () => {
    const fn = jest.fn();

    const dataset = new EntityComponentDataset();

    dataset.onEntityCreated.add(fn);

    const entityId = dataset.createEntity();

    expect(fn).toHaveBeenCalledTimes(1);

    expect(fn).toHaveBeenLastCalledWith(entityId);
});

test("onEntityRemoved signal", () => {
    const fn = jest.fn();

    const dataset = new EntityComponentDataset();

    dataset.onEntityRemoved.add(fn);

    const entityId = dataset.createEntity();

    expect(fn).not.toHaveBeenCalled();

    dataset.removeEntity(entityId);

    expect(fn).toHaveBeenCalledTimes(1);

    expect(fn).toHaveBeenLastCalledWith(entityId);
});

test("can alter component map when number of entities is > 0 when no live components are affected", () => {
    const dataset = new EntityComponentDataset();

    dataset.createEntity();

    dataset.setComponentTypeMap([DummyComponentA]);

    expect(dataset.getComponentTypeMap()).toEqual([DummyComponentA]);

    expect(dataset.getComponentTypeCount()).toBe(1);
});

test("componentTypeCount is updated correctly when component map is set", () => {
    const dataset = new EntityComponentDataset();

    expect(dataset.getComponentTypeCount()).toBe(0);

    dataset.setComponentTypeMap([DummyComponentA]);

    expect(dataset.getComponentTypeCount()).toBe(1);

    dataset.setComponentTypeMap([DummyComponentB]);

    expect(dataset.getComponentTypeCount()).toBe(1);

    dataset.setComponentTypeMap([DummyComponentB, DummyComponentA]);

    expect(dataset.getComponentTypeCount()).toBe(2);

    dataset.setComponentTypeMap([]);

    expect(dataset.getComponentTypeCount()).toBe(0);
});

test("entityCount is updated correctly when entities are added and removed", () => {
    const dataset = new EntityComponentDataset();

    expect(dataset.getEntityCount()).toBe(0);

    const a = dataset.createEntity();

    expect(dataset.getEntityCount()).toBe(1);

    const b = dataset.createEntity();
    const c = dataset.createEntity();

    expect(dataset.getEntityCount()).toBe(3);

    dataset.removeEntity(b);

    expect(dataset.getEntityCount()).toBe(2);

    dataset.removeEntity(a);

    expect(dataset.getEntityCount()).toBe(1);

    dataset.removeEntity(c);

    expect(dataset.getEntityCount()).toBe(0);
});

test("addComponentToEntity", () => {
    const dataset = new EntityComponentDataset();

    dataset.setComponentTypeMap([DummyComponentA]);

    const entityA = dataset.createEntity();

    const componentA = new DummyComponentA();

    dataset.addComponentToEntityByIndex(entityA, 0, componentA);

    expect(dataset.getComponentByIndex(entityA, 0)).toBe(componentA);

    dataset.removeEntity(entityA);

    dataset.setComponentTypeMap([DummyComponentB, DummyComponentA]);

    const componentB = new DummyComponentB();

    const entityB = dataset.createEntity();

    dataset.addComponentToEntityByIndex(entityB, 1, componentA);
    dataset.addComponentToEntityByIndex(entityB, 0, componentB);

    expect(dataset.getComponentByIndex(entityB, 0)).toBe(componentB);
    expect(dataset.getComponentByIndex(entityB, 1)).toBe(componentA);
});

test("removeComponentFromEntity", () => {
    const dataset = new EntityComponentDataset();

    dataset.setComponentTypeMap([DummyComponentA]);

    const entityA = dataset.createEntity();

    const componentA = new DummyComponentA();

    dataset.addComponentToEntityByIndex(entityA, 0, componentA);
    dataset.removeComponentFromEntityByIndex(entityA, 0);

    expect(dataset.getComponentByIndex(entityA, 0)).toBe(undefined);

    dataset.removeEntity(entityA);

    dataset.setComponentTypeMap([DummyComponentB, DummyComponentA]);

    const componentB = new DummyComponentB();

    const entityB = dataset.createEntity();

    dataset.addComponentToEntityByIndex(entityB, 1, componentA);
    dataset.addComponentToEntityByIndex(entityB, 0, componentB);

    dataset.removeComponentFromEntityByIndex(entityB, 0);

    expect(dataset.getComponentByIndex(entityB, 0)).toBe(undefined);
    expect(dataset.getComponentByIndex(entityB, 1)).toBe(componentA);

    dataset.removeComponentFromEntityByIndex(entityB, 1);

    expect(dataset.getComponentByIndex(entityB, 0)).toBe(undefined);
    expect(dataset.getComponentByIndex(entityB, 1)).toBe(undefined);
});

test("removing entity will remove its components also", () => {
    const dataset = new EntityComponentDataset();
    dataset.setComponentTypeMap([DummyComponentA]);
    const handler = jest.fn();

    const entity = dataset.createEntity();

    dataset.addEntityEventListener(entity, EventType.ComponentRemoved, handler);

    const componentInstance = new DummyComponentA();

    dataset.addComponentToEntityByIndex(entity, 0, componentInstance);

    dataset.removeEntity(entity);

    expect(handler).toHaveBeenCalledTimes(1);
});

test("removeObserver for multiple components cleans up correctly", () => {
    const dataset = new EntityComponentDataset();

    dataset.setComponentTypeMap([DummyComponentA, DummyComponentB]);

    const observer = new EntityObserver([DummyComponentA, DummyComponentB], noop, noop);

    dataset.addObserver(observer);


    dataset.removeObserver(observer);


    //check all retained observers to make sure removal has cleaned up correctly
    dataset.observers.forEach(store => {
        expect(store.indexOf(observer)).toBe(-1);
    });
});

test("remapping components preserves observers", () => {
    const dataset = new EntityComponentDataset();
    dataset.setComponentTypeMap([DummyComponentA]);

    const aLinked = jest.fn();
    const aUnlinked = jest.fn();

    const observerA = new EntityObserver([DummyComponentA], aLinked, aUnlinked);

    dataset.addObserver(observerA);

    //Adding a component
    dataset.setComponentTypeMap([DummyComponentA, DummyComponentB]);

    //validate existing observer A
    const e0 = dataset.createEntity();

    const a0 = new DummyComponentA();
    dataset.addComponentToEntity(e0, a0);

    expect(aLinked).toHaveBeenLastCalledWith(a0, e0);

    const abLinked = jest.fn();
    const abUnlinked = jest.fn();

    //introduce second observer
    const observerAB = new EntityObserver([DummyComponentA, DummyComponentB], abLinked, abUnlinked);

    dataset.addObserver(observerAB);

    //Changing component order
    dataset.setComponentTypeMap([DummyComponentB, DummyComponentA]);

    const b0 = new DummyComponentB();
    dataset.addComponentToEntity(e0, b0);

    expect(abLinked).toHaveBeenLastCalledWith(a0, b0, e0);

    const e1 = dataset.createEntity();

    const a1 = new DummyComponentA();
    dataset.addComponentToEntity(e1, a1);

    expect(aLinked).toHaveBeenLastCalledWith(a1, e1);

    dataset.removeComponentFromEntity(e0, DummyComponentB);

    //remove AB observer
    dataset.removeObserver(observerAB);

    //Remove component from the map
    dataset.setComponentTypeMap([DummyComponentA]);

    const e2 = dataset.createEntity();

    const a2 = new DummyComponentA();

    dataset.addComponentToEntity(e2, a2);

    expect(aLinked).toHaveBeenLastCalledWith(a2, e2);
});

test('traverseComponents with empty', () => {
    const ecd = new EntityComponentDataset();

    ecd.setComponentTypeMap([DummyComponentA]);

    const visitor = jest.fn();

    ecd.traverseComponents(DummyComponentA, visitor);

    expect(visitor).not.toHaveBeenCalled();
});

test('traverseComponents with 1 entity and 1 component', () => {
    const ecd = new EntityComponentDataset();

    ecd.setComponentTypeMap([DummyComponentA]);

    const visitor = jest.fn();

    const entity = ecd.createEntity();
    const cA = new DummyComponentA();

    ecd.addComponentToEntity(entity, cA);

    ecd.traverseComponents(DummyComponentA, visitor);

    expect(visitor).toHaveBeenCalledTimes(1);
    expect(visitor).toHaveBeenCalledWith(cA, entity);
});

test('traverseComponents with 2 entity and 2 component', () => {
    const ecd = new EntityComponentDataset();

    ecd.setComponentTypeMap([DummyComponentA]);

    const visitor = jest.fn();

    const entity_0 = ecd.createEntity();
    const cA_0 = new DummyComponentA();

    ecd.addComponentToEntity(entity_0, cA_0);

    const entity_1 = ecd.createEntity();
    const cA_1 = new DummyComponentA();

    ecd.addComponentToEntity(entity_1, cA_1);

    ecd.traverseComponents(DummyComponentA, visitor);

    expect(visitor).toHaveBeenCalledTimes(2);
    expect(visitor).toHaveBeenCalledWith(cA_0, entity_0);
    expect(visitor).toHaveBeenCalledWith(cA_1, entity_1);
});

test('traverseComponents with 2 entity and 1 component', () => {
    const ecd = new EntityComponentDataset();

    ecd.setComponentTypeMap([DummyComponentA]);

    const visitor = jest.fn();

    const entity_0 = ecd.createEntity();

    const entity_1 = ecd.createEntity();
    const cA_1 = new DummyComponentA();

    ecd.addComponentToEntity(entity_1, cA_1);

    ecd.traverseComponents(DummyComponentA, visitor);

    expect(visitor).toHaveBeenCalledTimes(1);
    expect(visitor).toHaveBeenCalledWith(cA_1, entity_1);
});

test('traverseComponents with early exist', () => {
    const ecd = new EntityComponentDataset();

    ecd.setComponentTypeMap([DummyComponentA]);

    const visitor = jest.fn(() => false);

    const entity_0 = ecd.createEntity();
    const cA_0 = new DummyComponentA();

    ecd.addComponentToEntity(entity_0, cA_0);

    const entity_1 = ecd.createEntity();
    const cA_1 = new DummyComponentA();

    ecd.addComponentToEntity(entity_1, cA_1);

    ecd.traverseComponents(DummyComponentA, visitor);

    expect(visitor).toHaveBeenCalledTimes(1);
});

test('traverseEntities with no entities and no components', () => {
    const ecd = new EntityComponentDataset();

    ecd.setComponentTypeMap([DummyComponentA]);

    const visitor = jest.fn();

    ecd.traverseEntities([], visitor);

    expect(visitor).not.toHaveBeenCalled();

    ecd.traverseEntities([DummyComponentA], visitor);

    expect(visitor).not.toHaveBeenCalled();
});

test('traverseEntities with 1 entity and no components', () => {
    const ecd = new EntityComponentDataset();

    ecd.setComponentTypeMap([DummyComponentA]);

    const entity_0 = ecd.createEntity();
    const cA_0 = new DummyComponentA();

    ecd.addComponentToEntity(entity_0, cA_0);

    const component = ecd.getComponent(entity_0, DummyComponentA);

    expect(component).toBeDefined();

    expect(component).toBe(cA_0);
});

test('getComponent with 1 entity and 1 component', () => {
    const ecd = new EntityComponentDataset();

    ecd.setComponentTypeMap([DummyComponentA]);

    const visitor_0 = jest.fn();

    const entity_0 = ecd.createEntity();

    ecd.traverseEntities([], visitor_0);

    expect(visitor_0).toHaveBeenCalledWith(entity_0);

    const visitor_1 = jest.fn();

    ecd.traverseEntities([DummyComponentA], visitor_1);

    expect(visitor_1).not.toHaveBeenCalled();
});


test('isComponentTypeRegistered', () => {
    const ecd = new EntityComponentDataset();

    expect(ecd.isComponentTypeRegistered(DummyComponentA)).toBe(false);
    expect(ecd.isComponentTypeRegistered(DummyComponentB)).toBe(false);

    ecd.setComponentTypeMap([DummyComponentA]);

    expect(ecd.isComponentTypeRegistered(DummyComponentA)).toBe(true);
    expect(ecd.isComponentTypeRegistered(DummyComponentB)).toBe(false);

    ecd.setComponentTypeMap([DummyComponentB]);

    expect(ecd.isComponentTypeRegistered(DummyComponentA)).toBe(false);
    expect(ecd.isComponentTypeRegistered(DummyComponentB)).toBe(true);

    ecd.setComponentTypeMap([DummyComponentA, DummyComponentB]);

    expect(ecd.isComponentTypeRegistered(DummyComponentA)).toBe(true);
    expect(ecd.isComponentTypeRegistered(DummyComponentB)).toBe(true);
});

test('isEmpty', () => {

    const ecd = new EntityComponentDataset();

    expect(ecd.isEmpty()).toBe(true);

    const entity = ecd.createEntity();

    expect(ecd.isEmpty()).toBe(false);

});

test("getComponentClassByName", () => {

    const ecd = new EntityComponentDataset();

    expect(ecd.getComponentClassByName(DummyComponentA.typeName)).toBe(null);
    expect(ecd.getComponentClassByName(DummyComponentB.typeName)).toBe(null);

    ecd.setComponentTypeMap([DummyComponentA]);

    expect(ecd.getComponentClassByName(DummyComponentA.typeName)).toBe(DummyComponentA);

    expect(ecd.getComponentClassByName(DummyComponentB.typeName)).toBe(null);

    expect(ecd.getComponentClassByName('cat')).toBe(null);

    ecd.setComponentTypeMap([DummyComponentB]);

    expect(ecd.getComponentClassByName(DummyComponentA.typeName)).toBe(null);

    expect(ecd.getComponentClassByName(DummyComponentB.typeName)).toBe(DummyComponentB);

    ecd.setComponentTypeMap([DummyComponentA,DummyComponentB]);

    expect(ecd.getComponentClassByName(DummyComponentA.typeName)).toBe(DummyComponentA);

    expect(ecd.getComponentClassByName(DummyComponentB.typeName)).toBe(DummyComponentB);

});

describe('event management', () => {

    test("shouldn't be able to add event listener to non-existent entity", () => {
        const dataset = new EntityComponentDataset();
        const fn = jest.fn();

        expect(() => dataset.addEntityEventListener(0, 'test', fn)).toThrow();
    });


    test("shouldn't be able to add event listener to removed entity", () => {
        const dataset = new EntityComponentDataset();
        const fn = jest.fn();

        const entity = dataset.createEntity();
        dataset.removeEntity(entity);

        expect(() => dataset.addEntityEventListener(entity, 'test', fn)).toThrow();
    });

    test("should be able to add event listener to existing entity", () => {
        const dataset = new EntityComponentDataset();
        const fn = jest.fn();

        const entity = dataset.createEntity();

        expect(() => dataset.addEntityEventListener(entity, 'test', fn)).not.toThrow();
    });

    test("entity event dispatch does not interfere with other event listeners", () => {
        const dataset = new EntityComponentDataset();

        const handlerA = jest.fn();
        const handlerB = jest.fn();

        const entity = dataset.createEntity();

        dataset.addEntityEventListener(entity, 'a', handlerA);
        dataset.addEntityEventListener(entity, 'b', handlerB);

        expect(handlerA).not.toHaveBeenCalled();
        expect(handlerB).not.toHaveBeenCalled();

        dataset.sendEvent(entity, 'a', 'ahoy!');

        expect(handlerA).toHaveBeenLastCalledWith('ahoy!', entity);
        expect(handlerA).toHaveBeenCalledTimes(1);

        expect(handlerB).not.toHaveBeenCalled();

        dataset.sendEvent(entity, 'a', 'hey hey');

        expect(handlerA).toHaveBeenLastCalledWith('hey hey', entity);
        expect(handlerA).toHaveBeenCalledTimes(2);

        expect(handlerB).not.toHaveBeenCalled();

        dataset.removeEntityEventListener(entity, 'a', handlerA);

        dataset.sendEvent(entity, 'a', 'surprise!');

        //A shouldn't be invoked anymore
        expect(handlerA).toHaveBeenCalledTimes(2);

        dataset.sendEvent(entity, 'b', 'hello');

        expect(handlerB).toHaveBeenLastCalledWith('hello', entity);
        expect(handlerB).toHaveBeenCalledTimes(1);
    });

    test("removing listener during its invocation works correctly", () => {
        const dataset = new EntityComponentDataset();

        const handler = jest.fn(function () {
            //remove own handler
            dataset.removeEntityEventListener(entity, 'a', handler);
        });

        const entity = dataset.createEntity();

        dataset.addEntityEventListener(entity, 'a', handler);

        dataset.sendEvent(entity, 'a', 'hey hey');

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith('hey hey', entity);

        //dispatch again, this time handler should not be invoked
        dataset.sendEvent(entity, 'a', 'woof');

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test("entity event dispatch without listeners should not throw", () => {
        const dataset = new EntityComponentDataset();

        const entity = dataset.createEntity();

        expect(() => dataset.sendEvent(entity, 'a', 'hello')).not.toThrow();
    });

    test("entity event listener is automatically removed when entity is removed", () => {
        const dataset = new EntityComponentDataset();
        const handler = jest.fn();

        const entity = dataset.createEntity();

        dataset.addEntityEventListener(entity, 'a', handler);

        dataset.removeEntity(entity);

        //rebuild entity with the same id
        dataset.createEntitySpecific(entity);

        dataset.sendEvent(entity, 'a', 'hello');

        expect(handler).not.toHaveBeenCalled();
    });

    test("entity removal dispatches EntityRemoved event", () => {
        const dataset = new EntityComponentDataset();
        const handler = jest.fn();

        const entity = dataset.createEntity();

        dataset.addEntityEventListener(entity, EventType.EntityRemoved, handler);

        dataset.removeEntity(entity);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenLastCalledWith(entity, entity);
    });

    test("adding component dispatches ComponentAdded event", () => {
        const dataset = new EntityComponentDataset();
        dataset.setComponentTypeMap([DummyComponentA]);
        const handler = jest.fn();

        const entity = dataset.createEntity();

        dataset.addEntityEventListener(entity, EventType.ComponentAdded, handler);

        const componentInstance = new DummyComponentA();
        dataset.addComponentToEntityByIndex(entity, 0, componentInstance);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenLastCalledWith({ instance: componentInstance, klass: DummyComponentA }, entity);
    });

    test("removing component dispatches ComponentRemoved event", () => {
        const dataset = new EntityComponentDataset();
        dataset.setComponentTypeMap([DummyComponentA]);
        const handler = jest.fn();

        const entity = dataset.createEntity();

        dataset.addEntityEventListener(entity, EventType.ComponentRemoved, handler);

        const componentInstance = new DummyComponentA();

        dataset.addComponentToEntityByIndex(entity, 0, componentInstance);

        dataset.removeComponentFromEntityByIndex(entity, 0);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenLastCalledWith({ instance: componentInstance, klass: DummyComponentA }, entity);
    });
});
