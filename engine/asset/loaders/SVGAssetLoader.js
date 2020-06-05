import { AssetLoader } from "./AssetLoader.js";

export class SVGAssetLoader extends AssetLoader {

    load(url, callback, failure, progress) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);

        xhr.addEventListener('load', function () {
            if (xhr.readyState === xhr.DONE && xhr.status === 200) {
                const domParser = new DOMParser();
                const domXML = domParser.parseFromString(xhr.responseText, 'image/svg+xml');
                let svgRoot = domXML.children[0];
                const asset = {
                    create: function () {
                        return svgRoot.cloneNode(true);
                    }
                };
                callback(asset);
            }
        }, false);

        xhr.addEventListener('error', function () {
            failure(xhr);
        }, false);

        xhr.send();

    }

}
