
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

    function pingByFetch(url, start) {
        return new Promise((resolve, reject) => {
            if (typeof fetch !== 'function')
                return reject(new Error('no such method'));

            fetch(url.href, { method: 'HEAD', cache: 'no-cache', mode: 'no-cors' }).then(() => {
                resolve({ host: url.host, status: 'online', time: (Date.now() - start) });
            }, () => {
                resolve({ host: url.host, status: 'offline', time: (Date.now() - start) });
            });
        });
    }

    function pingByScript(url, start) {
        return new Promise((resolve, reject) => {
            const onerror = (event) => {
                doc.head.removeChild(event.target);
                reject(new Error('cannot check status'));
            }

            const onload = (event) => {
                doc.head.removeChild(event.target);
                resolve({ host: url.host, status: 'online', time: (Date.now() - start) });
            }

            url.search = `_=${start}`;

            const script = doc.createElement('script');
            script.onerror = onerror;
            script.onload = onload;
            script.type = 'application/javascript'; // Required in HTML4
            script.src = url.href;
            doc.head.appendChild(script);
        });
    }

    function pingByFavicon(url, favicon, start) {
        return new Promise((resolve, reject) => {
            url.pathname = favicon;
            url.search = `_=${start}`;

            const image = new Image();
            image.onerror = () => resolve({ host: url.host, status: 'offline', time: (Date.now() - start) });
            image.onload = () => resolve({ host: url.host, status: 'online', time: (Date.now() - start) });
            image.src = url.href;
        });
    }

    return function ping(host, options = {}) {
        return new Promise((resolve, reject) => {
            const url = doc.createElement('a');
            url.href = host;
            url.pathname = '';
            url.search = '';
            url.hash = '';
            if (location.protocol === 'https:' && url.protocol === 'http:')
                return reject(new Error('insecure request'));

            const timeout = options.timeout || 60 * 1000;
            const favicon = options.favicon || 'favicon.ico';
            const timerid = setTimeout(() => resolve({ host: host, status: 'timeout', time: timeout }), timeout);

            pingByFetch(url, Date.now()).then((result) => {
                clearTimeout(timerid);
                resolve(result);
            }, (error) => {
                pingByScript(url, Date.now()).then((result) => {
                    clearTimeout(timerid);
                    resolve(result);
                }, (error) => {
                    pingByFavicon(url, favicon, Date.now()).then((result) => {
                        clearTimeout(timerid);
                        resolve(result);
                    }, (error) => {
                        clearTimeout(timerid);
                        reject(error);
                    });
                });
            });
        });
    }

}));