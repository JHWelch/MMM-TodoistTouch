# MMM-TodoistTouch

This is a module for the [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror/).

## Installation

In `~/MagicMirror/modules`

```sh
git clone https://github.com/JHWelch/MMM-TodoistTouch.git
cd MMM-TodoistTouch
npm install --omit=dev
```

### Keyboard

To use the "Add Task" functionality, this module requires [MMM-Keyboard](https://github.com/jhwelch/MMM-Keyboard). Either this fork or the original @lavolp3 version will work.

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

The "API token" found in your account's [Integration > Developer settings](https://todoist.com/app/settings/integrations/developer)

#### Add new App Integration 

Create new integration in the [App Management Console](https://developer.todoist.com/appconsole.html). 

Use either the "test token" provided there, or go through an Oauth flow to get a token for your own account. 

### Customizing Config

| Option            | Required?    | Description                                                                                                                                                                                                  |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `token`           | **Required** | Your Todoist API token.                                                                                                                                                                                      |
| `updateInterval`  | *Optional*   | Refresh time in milliseconds <br>Default 60000 milliseconds (1 minute)                                                                                                                                       |
| `filter`          | *Optional*   | Filter to apply to tasks. See [Todoist Filters](https://www.todoist.com/help/todoist/features/introduction-to-filters-V98wIH) <br>Default `null` (no filter)                                                 |
| `noTasksMessage`  | *Optional*   | Message to display when there are no tasks. <br>Default `NO_TASKS` (see translation strings)                                                                                                                 |
| `addTaskArgs`     | *Optional*   | Additional task data to pass when creating a new task. [See full list of args](https://github.com/Doist/todoist-sdk-typescript/blob/b9b9dbd3dd1d1b4b5447ff2e89cf63e1ec68f54c/src/types/tasks/requests.ts#L8) |
| `tabs`            | *Optional*   | Allows for multiple tabs of tasks. See [the Tabs Config](#tabs-config) section below for more information                                                                                                    |
| `autoTabMode`     | *Optional*   | Whether to automatically change tabs. Options are `'return-home'`, `'advance'` or `null`. <br> Default `null` (nothing)                                                                                      |
| `autoTabInterval` | *Optional*   | The interval after which to perform the `autoTabMode` action. If `autoTabMode` is null, has no affect. <br> Default `10000` milliseconds (10 seconds)                                                        |

#### Tabs Config

Specify a number of different tabs, each with their own filter. Requires a touch screen for use.

```js
{
  tabs: [
    {
      name: 'Family',
      filter: '#Family',
    },
    {
      name: 'Jordan',
      filter: '#Personal',
      addTaskArgs: {
        projectId: 'personal-project-id',
        dueString: 'today',
      },
    },
  ],
}
```

| Option        | Required?    | Description                                                                                                                    |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `name`        | **Required** | The title of tab. Text shown on the tab button                                                                                 |
| `filter`      | **Required** | Filter to apply to tasks. See [Todoist Filters](https://www.todoist.com/help/todoist/features/introduction-to-filters-V98wIH). |
| `addTaskArgs` | *Optional*   | Override `addTaskArgs` for the tab. See `addTaskArgs` in the [main config](#customizing-config).                               |

#### Auto Tab mode

When using tabs, you have the ability to automatically change tabs based on an interval. To set this you will use `autoTabMode` and `autoTabInterval`.

If  `autoTabMode` is set to `null` then `autoTabInterval` has no affect.

##### `'return-home'` Auto Tab Mode

After `autoTabInterval` milliseconds without user interaction, changes tab to the "home" tab. (Index 0)

##### `'advance'` Auto Tab Mode

After `autoTabInterval` milliseconds without user interaction, the active tab will advance to the next tab. So with three tabs, 0 -> 1 -> 2 -> 0 ->...

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
