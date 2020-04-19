import EntityBuilder, { EntityBuilderFlags } from "./EntityBuilder.js";
import { EntityComponentDataset } from "./EntityComponentDataset.js";


class DummyComponent {
}

/**
 *
 * @return {EntityComponentDataset}
 */
function sampleDataset() {
    const dataset = new EntityComponentDataset();

    dataset.setComponentTypeMap([DummyComponent]);

    return dataset;
}

test("constructor doesn't throw", () => {
    new EntityBuilder();
});

test("entity exists in dataset after build", () => {
    const dataset = new EntityComponentDataset();

    const builder = new EntityBuilder();

    const entity = builder.build(dataset);

    expect(dataset.entityExists(entity)).toBe(true);
});

test("component exist in dataset after build", () => {
    const dataset = new EntityComponentDataset();

    dataset.setComponentTypeMap([DummyComponent]);

    const builder = new EntityBuilder();

    const component = new DummyComponent();

    builder.add(component);

    const entity = builder.build(dataset);

    expect(dataset.entityExists(entity)).toBe(true);

    expect(dataset.getComponentByIndex(entity, 0)).toBe(component);
});

test("'Built' flag is reset when entity is removed without invoking 'destroy' method", () => {
    const dataset = sampleDataset();

    const b = new EntityBuilder();

    b.build(dataset);

    expect(b.getFlag(EntityBuilderFlags.Built)).toBe(true);

    dataset.removeEntity(b.entity);

    expect(b.getFlag(EntityBuilderFlags.Built)).toBe(false);
});
