# GD-LVLDOWNLOADER

A small Node.js website that requests public Geometry Dash level data from Boomlings and downloads the returned level string as a `.gdlvl` text file.

## Requirements

- Node.js 20 or newer
- Internet access to reach `www.boomlings.com`

## Run locally

1. Clone or download this repository.
2. Open a terminal in the project folder.
3. Run:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000).

No npm packages are required.

## Deploy

Deploy it to a Node.js hosting provider that supports long-running web services. Set the start command to `npm start`. The host must allow outbound HTTPS requests to Boomlings.

This is a backend application; GitHub Pages alone cannot run the Node.js proxy.

## Notes

- The app requests levels by numeric ID.
- It does not request or store a Geometry Dash password.
- Only levels that the game server makes available can be downloaded.
- The `.gdlvl` extension is used by this project for the downloaded raw level-string text; it is not claimed to be an official Geometry Dash import format.
- Geometry Dash's server protocol and availability can change, so successful downloads depend on Boomlings.

## Disclaimer

This is an unofficial community utility and is not affiliated with RobTop Games.
