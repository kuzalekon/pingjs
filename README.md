# Pings
Pings is a small and simply utility to ping webservers from client-side (browser)

## Usage
Note: the utility is exports as **UMD module**.
```js
const ping = require('pings');
// Ping a domain.com with 3 secs timeout
ping('https://domain.com', (error, status) => {
    // Possible error messages: "timeout occured" and "insecure request"
    // Possible status values: "online" and "offline"
    error === null ? console.log(status) : console.error(error.message);
}, 3000 /* timeout = 3 secs */);
```
