export class GuiElementParallax {
    constructor() {
        this.angle = 10;
    }

    static from({ angle = 10 } = {}) {
        const r = new GuiElementParallax();

        r.angle = angle;

        return r;
    }
}

GuiElementParallax.typeName = 'GuiElementParallax';
