
(function (name, root, init) {

    // RequireJS and other-like
    if (typeof define === 'function' && define.amd)
        define(name, function () { return init(window, document) });
    // CommonJS and other-like
    else if (typeof module === 'object' && module.exports)
        module.exports = init(window, document);
    // Other environments (browser & etc)
    else
        root[name] = init(window, document);

}('ping', this, function (win, doc) {

    var ONLINE  = 'online';
    var OFFLINE = 'offline';

    return function ping() {
        if (arguments.length < 1)
            throw new TypeError('too few arguments');

        var host = '';
        var timeout = 60 * 1000;
        var faviconPath = 'favicon.ico';
        if (typeof arguments[0] === 'string') {
            host = arguments[0];
        }
        else {
            var options = arguments[0];
            host = options.host || host;
            timeout = options.timeout || timeout;
            faviconPath = options.favicon || faviconPath;
        }

        return new Promise(function (resolve, reject) {
            var url = doc.createElement('a');
            url.href = host;
            url.pathname = '';
            url.search = '';
            url.hash = '';
            // Check for insecure request
            if (win.location.protocol === 'https:' && url.protocol === 'http:')
                return reject(new Error('insecure request'));

            var startTime = 0;
            var isTimeout = false;
            var timerId = win.setTimeout(function onTimeout() {
                isTimeout = true;
                reject(new Error('timeout occured'));
            }, timeout);

            pingByFetch(url.href);

            function pingByFetch(host) {
                if (typeof win.fetch !== 'function')
                    return pingByScript(host);

                startTime = Date.now();
                win.fetch(host, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' })
                    .then(function onFetchResolved() {
                        if (!isTimeout) {
                            win.clearTimeout(timerId);
                            resolve({
                                host: host,
                                status: ONLINE,
                                time: Date.now() - startTime
                            });
                        }
                    })
                    .catch(function onFetchRejected() {
                        if (!isTimeout) {
                            win.clearTimeout(timerId);
                            resolve({
                                host: host,
                                status: OFFLINE,
                                time: Date.now() - startTime
                            });
                        }
                    });
            }

            function pingByScript(host) {
                startTime = Date.now();

                var url = doc.createElement('a');
                url.href = host;
                url.search = '?_=' + Date.now();

                var script = document.createElement('script');
                script.type = 'application/javascript'; // Required in HTML4
                script.src = url.href;
                script.onload = script.onerror = function onScriptResponse(event) {
                    doc.head.removeChild(event.target);
                    if (!isTimeout) {
                        win.clearTimeout(this.__timer);
                        if (event.type === 'load')
                            resolve({
                                host: host,
                                status: ONLINE,
                                time: Date.now() - startTime
                            });
                        else
                            pingByFavicon(host);
                    }
                }

                doc.head.appendChild(script);
            }

            function pingByFavicon(host) {
                startTime = Date.now();

                var url = doc.createElement('a');
                url.href = host;
                url.pathname = faviconPath;
                url.search = '?_=' + Date.now();

                var favicon = new Image();
                favicon.src = url.href;
                favicon.onload = favicon.onerror = function onFaviconResponse(event) {
                    if (!isTimeout) {
                        win.clearTimeout(timerId);
                        resolve(event.type === 'load' ?
                            {
                                host: host,
                                status: ONLINE,
                                time: Date.now() - startTime
                            } :
                            {
                                host: host,
                                status: OFFLINE,
                                time: Date.now() - startTime
                            });
                    }
                }
            }

        });
    }

}));