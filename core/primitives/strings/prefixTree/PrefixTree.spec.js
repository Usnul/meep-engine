import { PrefixTree } from "./PrefixTree.js";

test('inset one letter', () => {
    const t = new PrefixTree();

    t.insertWord('a');

    const child = t.findChildByCharacter('a');

    expect(child.character).toBe('a');
    expect(child.children[0].word).toBe('a');
    expect(child.children[0].values.length).toBe(1);
});

test('insert one letter twice', () => {

    const t = new PrefixTree();

    t.insertWord('a');
    t.insertWord('a');

    const child = t.findChildByCharacter('a');

    expect(child.character).toBe('a');
    expect(child.children[0].word).toBe('a');
    expect(child.children[0].values.length).toBe(2);
});


test('complex', () => {

    const t = new PrefixTree();

    "cat sat on a mat. Horse smoked a camel. Bear snored, slithered and slobbered".split(/\s/).forEach(word => {
        t.insertWord(word);
    });

    console.log("");
});
