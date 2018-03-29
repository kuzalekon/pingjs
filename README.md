<br>
<p align="center"><img src="logo.png" alt="PingJS" /></p>
<p align="center">Utility to check the availability of host from browser</p>
<hr>

### Algorithm
Since it is not possible to check the availability of host using XMLHttpRequest because of Same-Origin-Policy, the following methods have been tested:

Fetch API - the replacement of XMLHttpRequest. It was noticed that if you execute "fetch" in the "no-cors" mode, unlike XMLHttpRequest, the "Origin" header will not be added to the query, which makes it possible to "get through" to the resource. The approach gives a 100% guarantee of reliability of verification.

Attempt to request a resource through the "script" tag. We create an instance of the "script" tag, in the "src" attribute we specify the address of the resource and sets the handlers of the "load" and "error" events. Accordingly, if the "load" event has occurred, the resource is available, and if "error" is not available. The approach has the following disadvantages:
A script parse error is written to the browser console;
If Content-Security-Policy is defined on domain the "error" event is raised. Reliability by my estimates - 80% - 90%.
Attempt to query "favicon" in the root of the domain. We create an instance of the class "Image", in the "src" attribute we specify the address of the resource, we broadcast the handlers to the "load" and "error" events. When the "load" occurs, the resource is available, with "error" - not available. The approach has a big disadvantage: not all resources have a "favicon", and not on all resources it is at the root. The reliability of the approach is 50% - 70%.
UrlChecker operates according to the following algorithm, consistently applying all three approaches:

Checking the "fetch" method in browser, if it is supported - we execute the resource request with its help, call the callback with the corresponding result. If the browser does not support "Fetch API" - go to the next step.
The availability check is performed by means of the "script" tag, when the "load" event occurs, the callback is invoked. If "error" occured - go to the next step.
The domain availability check is performed using the "favicon" query tool. Callback is called with the corresponding result.

### Installation
You can install `PingJS` using npm, yarn or bower:
```
$ npm install ping-js
$ yarn add ping-js
$ bower install ping-js
```
Note: utility exports as **UMD module**.

### Usage
```js
const ping = require('ping-js');

ping('https://domain.com')
    .then(result => console.log(result.status))
    .catch(error => console.error(error.message));

ping({ host: 'https://domain.com', timeout: 5000 /* 5 secs */ })
    .then(result => console.log(result.status))
    .catch(error => console.error(error.message));
```

### License
[`MIT`](https://mit-license.org/), &copy; 2018 Kuznetsov Aleksey.
