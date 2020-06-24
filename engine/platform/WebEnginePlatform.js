import { EnginePlatform } from "./EnginePlatform.js";
import { IndexedDBStorage } from "../save/storage/IndexedDBStorage.js";
import { StorageAchievementGateway } from "../achievements/gateway/StorageAchievementGateway.js";

export class WebEnginePlatform extends EnginePlatform {
    constructor() {
        super();

        /**
         *
         * @type {Storage}
         */
        this.storage = new IndexedDBStorage("com.lazykitty.komrade.game.state", this.services);
        this.storage.compressionEnabled = false;

        /**
         *
         * @type {StorageAchievementGateway}
         */
        this.achievements = new StorageAchievementGateway(this.storage);
    }

    getStorage() {
        return this.storage;
    }

    getAchievementGateway() {
        return this.achievements;
    }
}
