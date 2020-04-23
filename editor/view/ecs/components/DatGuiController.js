import GuiControl from "../../../../view/controller/controls/GuiControl.js";
import dat from "dat.gui";

class DatGuiController extends GuiControl {
    constructor({ classList = [] } = {}) {
        super();

        const gui = new dat.GUI({
            autoPlace: false,
            closed: false,
            closeOnTop: false, //If true, close/open button shows on top of the GUI
            resizable: false
        });

        this.gui = gui;

        const domElement = gui.domElement;
        this.el = domElement;
        this.dRoot.el = domElement;

        this.dRoot.addClass(GuiControl.CSS_CLASS_NAME);


        classList.forEach(c => this.addClass(c));
    }

    /**
     *
     * @param {object} object
     * @param {string} property
     * @param {number} bitIndex
     * @param {string} name
     * @param {*} [extra]
     */
    addBitFlag(object, property, bitIndex, name, extra) {

        const proxy = {
            get v() {
                return (object[property] & bitIndex) !== 0;
            },

            set v(v) {
                if (v) {
                    object[property] |= bitIndex;
                } else {
                    object[property] &= ~bitIndex;
                }
            }
        };

        const c = this.addControl(proxy, 'v');

        c
            .name(name);

        return c;
    }

    /**
     *
     * @param {function} method
     * @param {string} [name]
     * @param {*} [thisArg]
     * @return {Controller}
     */
    addAction(method, name, thisArg) {
        if (name === undefined) {
            name = method.name;
        }

        const proxy = {
            m: () => {
                method.call(thisArg);
            }
        };

        return this.add(proxy, 'm').name(name);
    }

    /**
     *
     * @param object
     * @param {string}  property
     * @param extra
     * @return {Controller}
     */
    add(object, property, extra) {
        const prop = object[property];

        if (prop === undefined) {
            throw new Error(`Property '${property}' is undefined`);
        }

        if (prop === null) {
            throw new Error(`Property '${property}' is null`);
        }

        let c;

        if (prop.isObservedBoolean || prop.isObservedInteger || prop.isVector1 || prop.isObservedString) {

            const proxy = { v: prop.getValue() };

            c = this.addControl(proxy, 'v');

            c
                .name(property)
                .onChange(v => prop.set(v));

            this.bindSignal(prop.onChanged, v => {
                proxy.v = v;
                c.setValue(v);
            });

        } else if (prop.isVector2 || prop.isVector3) {

            const proxy = {
                get x() {
                    return prop.x;
                },
                set x(v) {
                    prop.setX(v);
                },
                get y() {
                    return prop.y;
                },
                set y(v) {
                    prop.setY(v);
                },
                get z() {
                    return prop.z;
                },
                set z(v) {
                    prop.setZ(v);
                }
            };

            const f = this.addFolder(property);

            let step = 0.00001;

            if (extra !== undefined && extra.step !== undefined) {
                step = extra.step;
            }


            f.add(proxy, 'x').step(step);
            f.add(proxy, 'y').step(step);

            if (prop.isVector3) {
                f.add(proxy, 'z').step(step);
            }

            c = f;
        } else {
            c = this.addControl(object, property, extra);
        }

        return c;
    }

    addEnumRaw(object, property, type) {

        const proxy = { v: object[property] };

        const c = this.addControl(proxy, "v", type);

        c.name(property);
        c.onChange(v => {
            for (let typeKey in type) {
                const typeValue = type[typeKey];
                if (typeValue == v) {
                    object[property] = typeValue;
                    return;
                }
            }

            console.warn(`Value ${v} not found in enum`, v, type);
        });

        return c;
    }

    /**
     *
     * @param {Object} object
     * @param {string} property
     * @param {Object|Array} [extra]
     * @returns {Controller}
     */
    addControl(object, property, extra) {
        if (object[property] === undefined) {
            throw new Error(`Object has no property '${property}'`);
        }

        const control = this.gui.add(object, property, extra);

        return control;
    }

    addFolder(name) {
        const control = this.gui.addFolder(name);


        return control;
    }

    addColorControl(object, property) {
        const control = this.gui.addColor(object, property);

        return control;
    }
}


export default DatGuiController;
