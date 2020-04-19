export class TextureAttachment {
    /**
     * @template T
     * @param {function(T):Texture} read
     * @param {function(T, Texture)} write
     * @param {string} [name]
     */
    constructor({ read, write, name }) {
        this.name = name;

        this.read = read;
        this.write = write;
    }
}
