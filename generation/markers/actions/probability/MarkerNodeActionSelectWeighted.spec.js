import { MarkerNodeActionSelectWeighted } from "./MarkerNodeActionSelectWeighted.js";
import { MarkerNodeActionWeightedElement } from "./MarkerNodeActionWeightedElement.js";
import { MarkerNodeAction } from "../MarkerNodeAction.js";
import { CellFilterLiteralFloat } from "../../../filtering/numeric/CellFilterLiteralFloat.js";
import { MarkerNode } from "../../MarkerNode.js";

function mockAction(f) {
    const action = new MarkerNodeAction();

    action.execute = f;

    return action;
}

function mockNode() {
    return new MarkerNode();
}

test('select with exactly 1 option', () => {

    const action = jest.fn();

    const sut = MarkerNodeActionSelectWeighted.from([
        MarkerNodeActionWeightedElement.from(mockAction(action), CellFilterLiteralFloat.from(0))
    ]);

    sut.execute(null, null, mockNode());

    expect(action).toHaveBeenCalled();
});


test('select with exactly 2 options', () => {

    const actionA = jest.fn();
    const actionB = jest.fn();

    const sut = MarkerNodeActionSelectWeighted.from([
        MarkerNodeActionWeightedElement.from(mockAction(actionA), CellFilterLiteralFloat.from(1)),
        MarkerNodeActionWeightedElement.from(mockAction(actionB), CellFilterLiteralFloat.from(1))
    ]);

    sut.__random = () => 0;

    sut.execute(null, null, mockNode());

    expect(actionA).toHaveBeenCalled();

    sut.__random = () => 0.49;

    sut.execute(null, null, mockNode());

    expect(actionA).toHaveBeenCalledTimes(2);

    sut.__random = () => 0.51;

    sut.execute(null, null, mockNode());

    expect(actionB).toHaveBeenCalledTimes(1);

    sut.__random = () => 1;

    sut.execute(null, null, mockNode());

    expect(actionB).toHaveBeenCalledTimes(2);
});

test('select with exactly 3 options', () => {

    const actionA = jest.fn();
    const actionB = jest.fn();
    const actionC = jest.fn();

    const sut = MarkerNodeActionSelectWeighted.from([
        MarkerNodeActionWeightedElement.from(mockAction(actionA), CellFilterLiteralFloat.from(1)),
        MarkerNodeActionWeightedElement.from(mockAction(actionB), CellFilterLiteralFloat.from(1)),
        MarkerNodeActionWeightedElement.from(mockAction(actionC), CellFilterLiteralFloat.from(1))
    ]);

    sut.__random = () => 0;

    sut.execute(null, null, mockNode());

    expect(actionA).toHaveBeenCalled();

    sut.__random = () => 0.32;

    sut.execute(null, null, mockNode());

    expect(actionA).toHaveBeenCalledTimes(2);

    sut.__random = () => 0.34;

    sut.execute(null, null, mockNode());

    expect(actionB).toHaveBeenCalledTimes(1);

    sut.__random = () => 0.65;

    sut.execute(null, null, mockNode());

    expect(actionB).toHaveBeenCalledTimes(2);

    sut.__random = () => 0.67;

    sut.execute(null, null, mockNode());

    expect(actionC).toHaveBeenCalledTimes(1);

    sut.__random = () => 1;

    sut.execute(null, null, mockNode());

    expect(actionC).toHaveBeenCalledTimes(2);
});
