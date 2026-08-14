require('../__mocks__/Module');
require('../__mocks__/globalLogger');

const name = 'MMM-TodoistTouch';

let MMMNotionTasks;

beforeEach(() => {
  jest.resetModules();
  require('../MMM-TodoistTouch');

  MMMNotionTasks = global.Module.create(name);
  MMMNotionTasks.setData({ name, identifier: `Module_1_${name}` });

  const date = new Date(2023, 9, 1); // October 1, 2023
  jest.useFakeTimers().setSystemTime(date);
});

afterEach(() => {
  jest.useRealTimers();
});

it('has a default config', () => {
  expect(MMMNotionTasks.defaults).toEqual({
    updateInterval: 60000,
  });
});

it('requires expected version', () => {
  expect(MMMNotionTasks.requiresVersion).toBe('2.28.0');
});

it('inits module in loading state', () => {
  expect(MMMNotionTasks.loading).toBe(true);
});

describe('start', () => {
  const originalInterval = setInterval;
  const configObject = {

  };

  beforeEach(() => {
    MMMNotionTasks.setConfig(configObject);
    global.setInterval = jest.fn();
  });

  afterEach(() => {
    global.setInterval = originalInterval;
  });

  it('logs start of module', () => {
    MMMNotionTasks.start();

    expect(global.Log.info).toHaveBeenCalledWith('Starting module: MMM-TodoistTouch');
  });

  it('requests data from node_helper with config variables', () => {
    MMMNotionTasks.start();

    expect(MMMNotionTasks.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-TodoistTouch-FETCH', configObject);
  });

  test('interval requests data from node_helper', () => {
    MMMNotionTasks.start();
    global.setInterval.mock.calls[0][0]();

    expect(MMMNotionTasks.sendSocketNotification).toHaveBeenCalledTimes(2);
    expect(MMMNotionTasks.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-TodoistTouch-FETCH', configObject);
  });

  test('interval set starts with default value', () => {
    MMMNotionTasks.setConfig({ updateInterval: 100000 });
    MMMNotionTasks.start();

    expect(global.setInterval)
      .toHaveBeenCalledWith(expect.any(Function), 100000);
  });
});

describe('getTemplate', () => {
  it('returns template path', () => {
    expect(MMMNotionTasks.getTemplate()).toBe('MMM-TodoistTouch.njk');
  });
});

describe('getTemplateData', () => {
  it('returns template data when loading', () => {
    expect(MMMNotionTasks.getTemplateData()).toEqual({
      loading: true,
    });
  });

  it('returns template data when not loading', () => {
    MMMNotionTasks.loading = false;

    expect(MMMNotionTasks.getTemplateData()).toEqual({
      loading: false,
    });
  });
});

describe('getStyles', () => {
  it('returns styles path', () => {
    expect(MMMNotionTasks.getStyles()).toEqual([
      'font-awesome.css',
      'MMM-TodoistTouch.css',
    ]);
  });
});

describe('socketNotificationReceived', () => {
  //
});
