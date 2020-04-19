import { BinaryObjectSerializationAdapter } from "./BinaryObjectSerializationAdapter.js";
import { BinaryClassSerializationAdapter } from "../BinaryClassSerializationAdapter.js";
import { BinarySerializationRegistry } from "../BinarySerializationRegistry.js";
import { BinaryBuffer } from "../../../../../core/binary/BinaryBuffer.js";

class Dummy {
    constructor(v) {
        this.v = v;
    }

    equals(other) {
        return this.v === other.v;
    }
}

Dummy.typeName = "Dummy";

class DummySerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Dummy;
        this.version = 0;
    }

    serialize(buffer, value) {
        buffer.writeFloat64(value.v);
    }

    deserialize(buffer, value) {
        const v = buffer.readFloat64();

        value.v = v;
    }
}

test("constructor does not throw", () => {
    new BinaryObjectSerializationAdapter();
});

test("read/write one", () => {
    const adapter = new BinaryObjectSerializationAdapter();

    const registry = new BinarySerializationRegistry();

    registry.registerAdapter(new DummySerializationAdapter());

    adapter.initialize(registry);

    const buffer = new BinaryBuffer();

    adapter.serialize(buffer, new Dummy(7));

    buffer.position = 0;

    const actual = adapter.deserialize(buffer);

    expect(actual.v).toBe(7);
});
