/**
 * Created by Alex on 26/04/2015.
 */

const xhr = function (path, success, error) {
    const httpRequest = new XMLHttpRequest();

    httpRequest.open("GET", path, true);


    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                if (success) {
                    success(httpRequest.response);
                }
            } else {
                if (error) {
                    error(httpRequest);
                }
            }
        }
    };
    httpRequest.send();
};
export default xhr;
