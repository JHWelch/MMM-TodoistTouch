# MMM-TodoistTouch

This is a module for the [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror/).

## Installation

In ~/MagicMirror/modules

```sh
git clone https://github.com/JHWelch/MMM-TodoistTouch.git

npm install --omit=dev
```

## Using the module

To use this module, add the following configuration block to the `modules` array in the `config/config.js` file:

```js
{
  module: 'MMM-TodoistTouch',
  position: 'bottom_left',
  config: {
    token: 'YOUR_TODOIST_API_TOKEN',
    // See below for optional configuration values
  }
}
```

### How to acquire a Todoist API token

#### Use Account API Token (easiest)

- The "API token" found in your account's [Integration > Developer settings](https://todoist.com/app/settings/integrations/developer)

#### Add new App Integration 

Create new integration in the [App Management Console](https://developer.todoist.com/appconsole.html). 

Use either the "test token" provided there, or go through an Oauth flow to get a token for your own account. 

### Customizing Config

| Option           | Required?    | Description                                                            |
| ---------------- | ------------ | ---------------------------------------------------------------------- |
| `token`          | **Required** | Your Todoist API token.                                                |
| `updateInterval` | *Optional*   | Refresh time in milliseconds <br>Default 60000 milliseconds (1 minute) |

## Update

### Automatic Update

Did you know MagicMirror² has a built-in module updater? Read more about it [here](https://docs.magicmirror.builders/modules/updatenotification.html#updates-array).

Add the following to your `updates` array of `updatenotification` in `config/config.js`

```js
{ 'MMM-TodoistTouch': 'git pull && npm install --omit=dev' },
```

### Manual Update

In `~/MagicMirror/modules/MMM-TodoistTouch`

```sh
git pull
npm install --omit=dev
```

## Development

Install dev dependencies

```sh
npm install
```

### Testing

There is a test suite using Jest.

```sh
node --run test
```

### Linting

There is linting using ESLint

```sh
# Run linting
node --run lint

# Fix linting errors
node --run fix
```
