
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

}('ping', this, function (doc) {

    const ping = (host, options = {}) => {
        return new Promise((resolve, reject) => {
            if (!host || typeof host !== 'string')
                reject(new Error('\"host\" must be a string'));

            // Setup a request timeout to 1 minute by default
            const timeout = options.timeout || 60 * 1000;
            // Setup a favicon path by default (most popular is "/favicon.ico")
            const favicon = options.favicon || 'favicon.ico'

            if (!timeout || typeof timeout !== 'number')
                reject(new Error('\"timeout\" must be a number'));

            if (!favicon || typeof favicon !== 'string')
                reject(new Error('\"favicon\" must be a string'));

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
                url.pathname = favicon;
                url.search = `?_=${+new Date()}`; // Disable cache

                const start = +new Date(); // Check start time
                // If path to favicon is specified we believe that accuracy of method
                // is high (because user knowns path), otherwise we believe accuracy is low
                const result = { host: host, accuracy: options.favicon ? 'high' : 'low' };

                // Function for processing the result of favicon loading
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

            // Tries to check availability of host by request resource as script.
            // If the "onload" handler called - the host is available,
            // and if called "onerror" handler - the host is unavailable.
            const pingByScript = () => {
                url.search = `?_=${+new Date()}`; // Disable cache

                const start = +new Date(); // Check start time
                const result = { host: host, accuracy: 'medium' };
                const head = doc.getElementsByTagName('head')[0];

                // Function for processing the result of script loading
                const callback = (event) => {
                    clearTimeout(timerId);
                    head.removeChild(event.target);

                    result.status = event.type === 'load' ? 'available' : 'unavailable';
                    result.time = +new Date() - start;
                    resolve(result);
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
                const start = +new Date(); // Check start time
                const result = { host: host, accuracy: 'high' };

                fetch(url.href, init).then(() => {
                    resolve({ ...result, status: 'available', time: +new Date() - start });
                }, () => {
                    resolve({ ...result, status: 'unavailable', time: +new Date() - start });
                });
            }

            // If our page is loaded via HTTPS, and the resources of the host being tested
            // are loading via HTTP, then the only way to check is to request favicon
            if (location.protocol === 'https:' && url.protocol === 'http:')
                return pingByFavicon();

            // In older browsers (where there is no method "fetch") we can only check host
            // availability by requesting resource as script or request a favicon
            if (!fetch)
                return pingByScript();

            pingByFetch();
        });
    }

    return ping;

}));