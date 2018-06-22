
(function (name, root, init) {

    // RequireJS and other-like
    if (typeof define === 'function' && define.amd)
        define(name, () => init(document));
    // CommonJS and other-like
    else if (typeof module === 'object' && module.exports)
        module.exports = init(document);
    // Other environments (browser & etc)
    else
        root[name] = init(document);

}('ping', this || window, function (doc) {

    'use strict';

    /**
     * Checks availability of host
     *
     * @function ping
     * @global
     * @async
     * @param {String} host Host address for check
     * @param {Object} options Additional options of check such as timeout value or favicon path
     */
    const ping = (host, options = {}) => {
        return new Promise((resolve, reject) => {
            if (!host || typeof host !== 'string')
                reject(new TypeError('\"host\" must be a string'));

            // Setup a request timeout to 30 seconds by default
            const timeout = options.timeout || 30 * 1000;
            // Setup a favicon path by default (most popular is "/favicon.ico")
            const favicon = options.favicon || 'favicon.ico'

            if (!timeout || typeof timeout !== 'number')
                reject(new TypeError('\"timeout\" must be a number'));

            if (!favicon || typeof favicon !== 'string')
                reject(new TypeError('\"favicon\" must be a string'));

            // Use HTMLAnchorElement as a cross-browser wrapper of URL object
            const url = doc.createElement('a');
            url.href = host;
            // Cleanup all parts of URL except the "host"
            url.pathname = '';
            url.search = '';
            url.hash = '';
            url.username = '';
            url.password = '';

            // Host link normalization
            host = url.host;

            // Setup a request timeout callback
            const timerId = setTimeout(() => {
                resolve({ host: host, status: 'timeout', time: timeout });
            }, timeout);

            // Tries to check availability of host by request a favicon.
            // If the "onload" handler called - the host is available,
            // and if called "onerror" handler - the host is unavailable.
            const pingByFavicon = () => {
                url.pathname = favicon; // Add favicon path to host URL
                url.search = `?_=${+new Date()}`; // Disable cache

                const start = +new Date(); // Start time of check
                // If path to favicon is specified we believe that accuracy of method
                // is high (because user knowns path), otherwise we believe accuracy is low
                const result = { host: host, accuracy: options.favicon ? 'high' : 'low' };

                // Callback used by "onload" and "onerror" handlers of img element
                const callback = (event) => {
                    clearTimeout(timerId);

                    result.status = event.type === 'load' ? 'available' : 'unavailable';
                    result.time = +new Date() - start;
                    resolve(result);
                }

                const image = new Image();
                image.onload = callback;
                image.onerror = callback;
                //image.crossorigin = 'anonymous';
                image.src = url.href;
            }

            // Tries to check availability of host by request index page as script.
            // If the "onload" handler called - the host is available,
            // and if called "onerror" handler - the host is unavailable.
            const pingByScript = () => {
                url.search = `?_=${+new Date()}`; // Disable cache

                const start = +new Date(); // Start time of check
                const result = { host: host, accuracy: 'medium' };
                const head = doc.getElementsByTagName('head')[0];

                // Callback used by "onload" and "onerror" handlers of script element
                const callback = (event) => {
                    clearTimeout(timerId);
                    head.removeChild(event.target);

                    if (event.type === 'error') {
                        pingByFavicon();
                    }
                    else {
                        result.status = 'available';
                        result.time = +new Date() - start;
                        resolve(result);
                    }
                }

                const script = doc.createElement('script');
                script.onload = callback;
                script.onerror = callback;
                script.type = 'application/javascript'; // Required in HTML4
                //script.crossorigin = 'anonymous';
                script.src = url.href;

                head.appendChild(script);
            }

            // Tries to check availability of host by "fetch" method.
            // If returned promise is resolved - the host is available,
            // otherwise - the host is unavailable.
            const pingByFetch = () => {
                const init = { method: 'head', mode: 'no-cors' /* required */, cache: 'no-cache' };
                const start = +new Date(); // Start time of check
                const result = { host: host, accuracy: 'high' };

                fetch(url.href, init).then(() => {
                    resolve({ ...result, status: 'available', time: +new Date() - start });
                }, () => {
                    resolve({ ...result, status: 'unavailable', time: +new Date() - start });
                });
            }

            // If our page is loaded via HTTPS, but the tested host can be loaded
            // only via HTTP, then the only way to check is to request favicon
            if (location.protocol === 'https:' && url.protocol === 'http:') {
                pingByFavicon();
            }
            // In older browsers (where there is no method "fetch") we only can check host
            // availability by requesting index page as script and/or favicon
            else if (!fetch) {
                pingByScript();
            }
            // All ok, we can check availability with high accuracy
            else {
                pingByFetch();
            }
        });
    }

    return ping;

}));