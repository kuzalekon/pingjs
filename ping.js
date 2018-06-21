
(function (name, root, init) {

    // RequireJS and other-like
    if (typeof define === 'function' && define.amd)
        define(name, function () { return init(document) });
    // CommonJS and other-like
    else if (typeof module === 'object' && module.exports)
        module.exports = init(document);
    // Other environments (browser & etc)
    else
        root[name] = init(document);

}('ping', this, function (doc) {

    const ping = (host, options = {}) => {
        return new Promise((resolve, reject) => {
            const url = doc.createElement('a'); // HTMLAnchorElement as URL wrapper
            url.href = host;
            // cleanup all URL paths except host
            url.pathname = '';
            url.search = '';
            url.hash = '';
            url.username = '';
            url.password = '';

            host = url.host; // normalize host

            const timeout = options.timeout || 60 * 1000; // 1 minute
            const favicon = options.favicon || 'favicon.ico' // most popular favicon path

            // setup a request timeout
            const timerId = setTimeout(() => {
                resolve({ host: host, method: undefined, status: 'timeout', time: timeout });
            }, timeout);

            const pingByFavicon = () => {
                url.pathname = favicon;
                url.search = '?_=' + new Date().getTime();

                const start = new Date().getTime();
                let result = { host: host, method: 'favicon' };

                const callback = (event) => {
                    clearTimeout(timerId);
                    result = { ...result, time: new Date().getTime() - start };
                    switch (event.type) {
                        case 'load': resolve({ ...result, status: 'online' }); break;
                        case 'error': resolve({ ...result, status: 'offline' }); break;
                        default: reject();
                    }
                }

                const image = new Image();
                image.onload = callback;
                image.onerror = callback;
                image.crossorigin = 'anonymous';
                image.src = url.href;
            }

            const pingByScript = () => {
                url.search = '?_=' + new Date().getTime();

                const start = new Date().getTime();
                let result = { host: host, method: 'script' };

                const callback = (event) => {
                    clearTimeout(timerId);
                    result = { ...result, time: new Date().getTime() - start };
                    switch (event.type) {
                        case 'load': resolve({ ...result, status: 'online' }); break;
                        case 'error': resolve({ ...result, status: 'offline' }); break;
                        default: reject();
                    }
                }

                const script = doc.createElement('script');
                script.onload = callback;
                script.onerror = callback;
                script.type = 'application/javascript'; // required in HTML4
                script.crossorigin = 'anonymous';
                script.src = url.href;

                doc.head.appendChild(script);
            }

            const pingByFetch = () => {
                const init = {
                    method: 'head',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    credentials: 'omit',
                    redirect: 'manual'
                };

                const start = new Date().getTime();
                const result = { host: host, method: 'fetch' };

                fetch(url.href, init).then(() => {
                    resolve({ ...result, status: 'online', time: new Date().getTime() - start });
                }, () => {
                    resolve({ ...result, status: 'offline', time: new Date().getTime() - start });
                });
            }

            if (location.protocol === 'https:' && url.protocol === 'http:')
                return pingByFavicon();

            if (!fetch)
                return pingByScript();

            pingByFetch();
        });
    }

    return ping;

}));