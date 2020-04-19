/**
 * Created by Alex on 19/02/14.
 */
import Shape from './Shape.js';

const MeshShape = function (mesh) {
    Shape.call(this);
    this.type = "mesh";
    this.mesh = mesh;
};
MeshShape.prototype = new Shape();
export default MeshShape;
