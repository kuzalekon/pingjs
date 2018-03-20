
(function (name, root, init) {

    if (typeof define === 'function' && define.amd)
        define(name, init(window, document));
    else if (typeof module === 'object' && module.exports)
        module.exports = init(window, document);
    else
        root[name] = init(window, document);

}('ringo', this, function (win, doc) {

    var Ping = (function () {

        var ONLINE = 'online';
        var OFFLINE = 'offline';

        function Ping(host, callback, timeout) {
            // Check required arguments
            if (!host || typeof host !== 'string')
                throw new TypeError('argument \"host\" must be a string');

            if (!callback || typeof callback !== 'function')
                throw new TypeError('argument \"callback\" must be a function');

            // Check optional arguments
            if (timeout && typeof timeout !== 'number')
                throw new TypeError('argument \"timeout\" must be a number');

            var url = doc.createElement('a');
            url.href = host;
            url.pathname = '';
            url.search = '';
            url.hash = '';
            // Check for insecure request
            if (win.location.protocol === 'https:' && url.protocol === 'http:')
                return callback (new Error('insecure request'), null);

            // Create timeout timer
            this.__timeout = false;
            this.__timer = win.setTimeout(function () {
                this.__timeout = true;
                callback(new Error('timeout occured'), null);
            }.bind(this), timeout ? timeout : 60000 /* 60 secs */);

            // Start ping
            this.__tryPingByFetch(url.href, callback);
        }

        Ping.prototype.__tryPingByFetch = function __tryPingByFetch(host, callback) {
            if (!win.fetch)
                return this.__tryPingByScript(host, callback);

            win.fetch(host, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' })
                .then(function __onFetchResolved() {
                    if (!this.__timeout) {
                        win.clearTimeout(this.__timer);
                        callback(null, ONLINE);
                    }
                }.bind(this))
                .catch(function __onFetchRejected() {
                    if (!this.__timeout) {
                        win.clearTimeout(this.__timer);
                        callback(null, OFFLINE);
                    }
                }.bind(this));
        }

        Ping.prototype.__tryPingByScript = function __tryPingByScript(host, callback) {
            var url = doc.createElement('a');
            url.href = host;
            url.search = '?_=' + Date.now();

            var script = document.createElement('script');
            script.type = 'application/javascript'; // Required in HTML4
            script.src = url.href;
            script.onload = script.onerror = function __onScriptResponse(event) {
                doc.head.removeChild(event.target);
                if (!this.__timeout) {
                    win.clearTimeout(this.__timer);
                    if (event.type === 'load')
                        callback(null, ONLINE);
                    else
                        this.__tryPingByFavicon(host, callback);
                }
            }.bind(this);

            doc.head.appendChild(script);
        }

        Ping.prototype.__tryPingByFavicon = function __tryPingFavicon(host, callback) {
            var url = doc.createElement('a');
            url.href = host;
            url.pathname = 'favicon.ico';
            url.search = '?_=' + Date.now();

            var favicon = new Image();
            favicon.src = url.href;
            favicon.onload = favicon.onerror = function __onFaviconResponse(event) {
                if (!this.__timeout) {
                    win.clearTimeout(this.__timeoutTimer);
                    callback(null, event.type === 'load' ? ONLINE : OFFLINE);
                }
            }.bind(this);
        }

        return Ping;

    }());

    return function ringo(host, callback, timeout) {
        new Ping(host, callback, timeout);
    }

}));