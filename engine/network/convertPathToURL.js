const rx_url_schema = /[a-zA-Z0-9_\-]+\:\/\//;

/**
 *
 * @param {string} path
 * @return {boolean}
 */
function isGlobalPath(path) {
    //search for URL schema at the start of the path
    return path.search(rx_url_schema) === 0;
}

// *** Environment setup code ***
const ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
const ENVIRONMENT_IS_WEB = typeof window === 'object';
const ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
const ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

/**
 *
 * @param {string} path
 * @return {string}
 */
export function convertPathToURL(path) {

    if (!isGlobalPath(path)) {

        /**
         * @type {Window|DedicatedWorkerGlobalScope}
         */
        let scope;

        if (ENVIRONMENT_IS_WEB) {
            scope = window;
        } else if (ENVIRONMENT_IS_WORKER) {
            scope = self;
        }

        const location = scope.location;
        const pathname = location.pathname;

        let directoryPath;

        /*
        path name contains file name also, there are two options here, "a/b" or "a/b/" second is a directory
        we need to extract directory to load relative path
        */

        if (pathname.endsWith('/')) {
            //path is to a directory
            directoryPath = pathname;
        } else {
            //path is to a file
            const i = pathname.lastIndexOf('/');

            if (i === -1) {
                //root level file
                directoryPath = ""
            } else {
                directoryPath = pathname.substring(0, i);
            }
        }

        const urlBase = location.protocol + "//" + location.host + directoryPath + "/";
        path = urlBase + path;
    }

    return path;
}
