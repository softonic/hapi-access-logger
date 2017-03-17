# @softonic/hapi-access-logger

Hapi plugin to log all requests and responses

## Installation

```bash
npm install @softonic/hapi-access-logger
```

## Usage

```js
// CommonJS
// const HapiAccessLogger = require('@softonic/hapi-access-logger');

// ES2015
import HapiAccessLogger from '@softonic/hapi-access-logger';

server.register({
  register: HapiAccessLogger,
  options: {
    logger: bunyan.createLogger({ name: "myapp" }),
    // whitelistHeaders and blacklistHeaders should not be used together
    whitelistRequestHeaders: [ 'host', 'accept', 'content-type'  ],
    blacklistRequestHeaders: [ 'authorization' ],
    whitelistResponseHeaders: [ 'content-type' ],
    blacklistResponseHeaders: [ 'set-cookie' ],
  }
});
```

## Testing

Clone the repository and execute:

```bash
npm test
```

## Contribute

1. Fork it: `git clone https://github.com/softonic/@softonic/hapi-access-logger.git`
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Added some feature'`
4. Check the build: `npm run build`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D
