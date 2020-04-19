/**
 * https://stackoverflow.com/questions/5916900/how-can-you-detect-the-version-of-a-browser
 * @returns {{name:String, version:Number}}
 */
function browserInfo() {
    let ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { name: 'IE', version: (tem[1] || '') };
    }

    if (M[1] === 'Chrome') {
        tem = ua.match(/\bOPR|Edge\/(\d+)/)
        if (tem != null) {
            return { name: 'Opera', version: tem[1] };
        }
    }

    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];

    if ((tem = ua.match(/version\/(\d+)/i)) != null) {
        M.splice(1, 1, tem[1]);
    }

    return {
        name: M[0],
        version: M[1]
    };
}

export {
    browserInfo
}