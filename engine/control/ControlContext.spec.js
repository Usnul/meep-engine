import { ControlContext } from "./ControlContext.js";
import { EntityComponentDataset } from "../ecs/EntityComponentDataset.js";
import { ControlContextState } from "./ControlContextState.js";
import { IllegalStateException } from "../../core/fsm/exceptions/IllegalStateException.js";

test("Constructor doesn't throw", () => {
    new ControlContext();
});

test("initial state", () => {
    const cc = new ControlContext();

    expect(cc.getState()).toBe(ControlContextState.Initial);
});

test("Initialization works as expected", () => {
    const cc = new ControlContext();

    cc.initialize(new EntityComponentDataset());

    expect(cc.getState()).toBe(ControlContextState.Ready);
});

test("full lifecycle", () => {
    const cc = new ControlContext();

    cc.initialize(new EntityComponentDataset());

    expect(cc.getState()).toBe(ControlContextState.Ready);

    cc.startup();

    expect(cc.getState()).toBe(ControlContextState.Running);

    cc.shutdown();

    expect(cc.getState()).toBe(ControlContextState.Ready);

    cc.dispose();

    expect(cc.getState()).toBe(ControlContextState.Disposed);
});

test("Illegal state exception on trying to startup without initialization", () => {

    const cc = new ControlContext();

    expect(() => cc.startup()).toThrowError(IllegalStateException);
});

test("Illegal state exception on trying to shutdown without initialization", () => {

    const cc = new ControlContext();

    expect(() => cc.shutdown()).toThrowError(IllegalStateException);
});

test("Illegal state exception on trying to initialize from running state", () => {

    const cc = new ControlContext();

    const ecd = new EntityComponentDataset();
    cc.initialize(ecd);
    cc.startup();

    expect(() => cc.initialize(ecd)).toThrowError(IllegalStateException);
});

test("Attempting to startup with a built entity must throw illegal state exception", () => {
    const cc = new ControlContext();
    cc.transientEntities = false;

    const ecd = new EntityComponentDataset();

    cc.initialize(ecd);

    cc.makeEntity().build(ecd);

    expect(() => cc.startup()).toThrowError(IllegalStateException);

});
