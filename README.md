# Ludos

A holochain hApp for collaborative dungeon building and playing. 

Real-time colloaboration delivered by [syn](https://github.com/holochain/syn).

## Install

1. Install and run the [Holochain Launcher](https://github.com/holochain/launcher/releases)
2. Click on *Install New App* and you should see Ludos available for install

or, to install manually with a webhapp file:

2. Go to [https://github.com/lightningrodlabs/ludos/releases] and download the *webapp* file under assets
3. In the Holochain Launcher click *Install New App* and *Select From Filesystem* and then choose the *webapp* file you downloaded.
4. Enjoy!

## Dev Environment Setup

1. Install the holochain dev environment (only nix-shell is required): https://developer.holochain.org/docs/install/
2. Enable Holochain cachix with:

```bash
nix-env -iA cachix -f https://cachix.org/api/v1/install
cachix use holochain-ci
```

3. Clone this repo and `cd` inside of it.
4. Enter the nix shell by running this in the root folder of the repository: 

```bash
nix-shell
npm install
```

## Dev mode

1. Run the app
  ```bash
  npm run start
  ```

2. Navigate to [localhost:5000](http://localhost:5000) in your browser. You should see the UI running.


## Releasing (manual)

### For Launcher

`npm run package:launcher`
the `*.webhapp` file will be available in the `apps/launcher/workdir` folder.
