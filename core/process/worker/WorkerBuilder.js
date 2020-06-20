/**
 * Created by Alex on 21/05/2016.
 */


import WorkerProxy from './WorkerProxy.js';
import { convertPathToURL } from "../../../engine/network/convertPathToURL.js";

const WorkerBuilder = function () {
    this.imports = [];
    this.methods = {};
    this.functions = [];
};

/**
 *
 * @param {string} name
 * @param {function} method
 */
WorkerBuilder.prototype.addMethod = function (name, method) {
    this.methods[name] = method;
};

/**
 *
 * @param {function} f
 */
WorkerBuilder.prototype.importFunction = function (f) {
    this.functions.push(f);
};

/**
 *
 * @param {string} path
 */
WorkerBuilder.prototype.importScript = function (path) {
    path = convertPathToURL(path);

    this.imports.push(path);
};

function codeToURL(code) {
    let blob;
    try {
        blob = new Blob([code], { type: 'application/javascript' });
    } catch (e) { // Backwards-compatibility
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        blob = new BlobBuilder();
        blob.append(code);
        blob = blob.getBlob();
    }
    return URL.createObjectURL(blob);
}

/**
 *
 * @returns {WorkerProxy}
 */
WorkerBuilder.prototype.build = function () {
    const codeLines = [];

    codeLines.push('var globalScope = this;');

    //handle imports
    this.imports.forEach(function (url) {
        codeLines.push("globalScope.importScripts('" + url + "');");
    });

    //handle functions
    this.functions.forEach(function (f) {
        codeLines.push(f.toString());
    });

    //api hash
    codeLines.push('var api = {};');
    for (let apiName in this.methods) {
        if (this.methods.hasOwnProperty(apiName)) {
            const method = this.methods[apiName];
            codeLines.push("api['" + apiName + "'] = " + method.toString() + ";");
        }
    }

    //api handler
    Array.prototype.push.apply(codeLines, [
        'function extractTransferables(obj, result){',
        '   if(typeof obj !== "object"){',
        '       return;', //not an object, skip
        '   }else if(obj.buffer instanceof ArrayBuffer){',
        '       result.push(obj.buffer);',
        '   }else{',
        '       for(var i in obj){',
        '           if(obj.hasOwnProperty(i)){ extractTransferables(obj[i], result); }',
        '       }',
        '   }',
        '}',

        'globalScope.onmessage = function(event){',
        '   var eventData = event.data;',
        '   var requestId = eventData.id',
        '   var methodName = eventData.methodName;',
        '   var parameters = eventData.parameters;',
        '   var method = api[methodName];',

        '   function sendResult(result){',
        '       var transferables = [];',
        '       extractTransferables(result, transferables);',
        '       globalScope.postMessage({methodName: methodName, id: requestId, result: result}, transferables);',
        '   }',

        '   function sendError(error){',
        '       globalScope.postMessage({methodName: methodName, id: requestId, error: {message: error.message, stack: error.stack.split("\\n") }});',
        '   }',

        '   if(method === undefined){',
        '       sendError(new Error("API named \'"+methodName+"\' was not found."));',
        '   }else{',
        '       method.apply(null,parameters).then(sendResult, sendError);',
        '   }',
        '};'
    ]);

    const code = codeLines.join("\n");
    const workerURL = codeToURL(code);

    const proxy = new WorkerProxy(workerURL, this.methods);
    return proxy;
};

export default WorkerBuilder;
