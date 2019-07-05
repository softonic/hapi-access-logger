# @softonic/hapi-access-logger

Hapi plugin to log requests and responses

## Installation

```bash
npm install @softonic/hapi-access-logger
```

## Usage

```js
import HapiAccessLogger from '@softonic/hapi-access-logger';

await server.register({
  plugin: HapiAccessLogger,
  options: {
    logger: bunyan.createLogger({ name: "myapp" }),
    // whitelistHeaders and blacklistHeaders should not be used together
    whitelistRequestHeaders: [ 'host', 'accept', 'content-type'  ],
    blacklistRequestHeaders: [ 'authorization' ],
    whitelistResponseHeaders: [ 'content-type' ],
    blacklistResponseHeaders: [ 'set-cookie' ],
    isLoggableRequest: request => get(request, 'route.settings.tags', []).includes('page')
  },
});
```

## Testing

Clone the repository and execute:

```bash
npm test
```

## Contribute

1. Fork it: `git clone https://github.com/softonic/hapi-access-logger.git`
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Added some feature'`
4. Check the build: `npm run build`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request :D
