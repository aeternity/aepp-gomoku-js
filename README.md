WIP

# Getting the project running

## Requirements

### epoch

This project assumes that local epoch node is running on port `3001`. You can use localnet provided in [epoch](https://github.com/aeternity/epoch) repository.

```sh
git clone https://github.com/aeternity/epoch.git
cd epoch
IMAGE_TAG=v0.25.0 docker-compose up -d
```

Please note that this project currently doesn't work with epoch v1.0.0 (you can use v0.25.0).

### accounts

You need to have two accounts. One for the client and one for the server. Make sure that each of them have at least 100 tokens.

Replace public and secret keys in `src/client/index.js` with keys belonging to one of aforementioned accounts.

```javascript
const secretKey = Buffer.from('_____PRIVATE KEY GOES HERE_____', 'hex')
const account = MemoryAccount({
  keypair: {
    publicKey: '_____PUBLIC KEY GOES HERE_____',
    secretKey
  }
})
```

Keys for the server account must be provided with environment variables (`WALLET_PUB` and `WALLET_PRIV`; see below).

## Running

```sh
yarn install
yarn run build
WALLET_PRIV=... WALLET_PUB=... yarn run start:dev
```

If you see error below simply run `yarn run start:dev` again.

```sh
/Users/michalpowaga/Desktop/dev/aepp-gomoku/src/gomoku/AppModel.js:3
import { getRandomInt } from './lib'
^^^^^^

SyntaxError: Unexpected token import
    at createScript (vm.js:80:10)
    at Object.runInThisContext (vm.js:139:10)
    at Module._compile (module.js:617:28)
    at Object.Module._extensions..js (module.js:664:10)
    at Module.load (module.js:566:32)
    at tryModuleLoad (module.js:506:12)
    at Function.Module._load (module.js:498:3)
    at Module.require (module.js:597:17)
    at require (internal/module.js:11:18)
    at Object.<anonymous> (/Users/michalpowaga/Desktop/dev/aepp-gomoku/index.js:1:77)
[nodemon] app crashed - waiting for file changes before starting...
```

If there aren't any errors you can go to `http://localhost:8080` to play the game. It will display the game board once state channel has opened (you can check logs in chrome dev tools `CMD+OPTION+J`).
