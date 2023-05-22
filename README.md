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

1. Install the holochain dev environment: https://developer.holochain.org/quick-start/

2. Clone this repo and `cd` inside of it.
3. Enter the nix shell by running this in the root folder of the repository: 

```bash
nix develop
npm install
```

## Dev mode: hc launch

1. Run the app
  ```bash
  npm run start
  ```

This will open a browser with the plaground and two `hc launch` windows with the app running.


## Dev mode: browser

1. Run the app
  ```bash
  npm run dev
  ```

2. Navigate to [localhost:5000](http://localhost:8888) in your browser. You should see the UI running.


## Releasing (manual)

`npm run package`
the `*.webhapp` file will be available in the `/workdir` folder.
