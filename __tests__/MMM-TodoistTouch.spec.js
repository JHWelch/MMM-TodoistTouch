/** @jest-environment jsdom */

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
    token: 'test-token',
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

describe('notificationReceived', () => {
  it('does nothing if notification is not MODULE_DOM_UPDATED', () => {
    MMMNotionTasks.bindTouchEvents = jest.fn();
    MMMNotionTasks.notificationReceived('SOME_OTHER_NOTIFICATION');

    expect(MMMNotionTasks.bindTouchEvents).not.toHaveBeenCalled();
  });

  it('binds touch events if notification is MODULE_DOM_UPDATED', () => {
    MMMNotionTasks.bindTouchEvents = jest.fn();
    MMMNotionTasks.notificationReceived('MODULE_DOM_UPDATED');

    expect(MMMNotionTasks.bindTouchEvents).toHaveBeenCalled();
  });
});

describe('bindTouchEvents', () => {
  it('binds touch events for close button', () => {
    const mockCloseButton = document.createElement('button');
    mockCloseButton.className = 'close-button';
    document.body.appendChild(mockCloseButton);
    MMMNotionTasks.openModal = jest.fn();

    MMMNotionTasks.bindTouchEvents();

    mockCloseButton.dispatchEvent(new Event('touchend'));
    expect(MMMNotionTasks.openModal).toHaveBeenCalled();
  });

  it('binds touch events for modal confirm button', () => {
    const mockConfirmButton = document.createElement('button');
    mockConfirmButton.className = 'modal-button-confirm';
    document.body.appendChild(mockConfirmButton);
    MMMNotionTasks.confirmCloseTask = jest.fn();

    MMMNotionTasks.bindTouchEvents();

    mockConfirmButton.dispatchEvent(new Event('click'));
    expect(MMMNotionTasks.confirmCloseTask).toHaveBeenCalled();
  });

  it('binds touch events for modal cancel button', () => {
    const mockCancelButton = document.createElement('button');
    mockCancelButton.className = 'modal-button-cancel';
    document.body.appendChild(mockCancelButton);
    MMMNotionTasks.cancelCloseTask = jest.fn();

    MMMNotionTasks.bindTouchEvents();

    mockCancelButton.dispatchEvent(new Event('touchend'));
    expect(MMMNotionTasks.cancelCloseTask).toHaveBeenCalled();
  });

});

describe('bindTouchEvent', () => {
  it('binds touchend and click events to elements with the given class', () => {
    const mockElement = document.createElement('div');
    mockElement.className = 'test-class';
    document.body.appendChild(mockElement);

    const callback = jest.fn();
    MMMNotionTasks.bindTouchEvent('.test-class', callback);

    mockElement.dispatchEvent(new Event('touchend'));
    mockElement.dispatchEvent(new Event('click'));

    expect(callback).toHaveBeenCalledTimes(2);

    document.body.removeChild(mockElement);
  });
});

describe('confirmCloseTask', () => {
  it('dispatches close task event to node_helper and hides the confirm modal', () => {
    const taskConfirm = document.createElement('div');
    taskConfirm.className = 'task-confirm';
    const triggerButton = document.createElement('button');
    const li = document.createElement('li');
    li.setAttribute('data-task-id', '123');
    li.appendChild(taskConfirm);
    li.appendChild(triggerButton);
    document.body.appendChild(li);
    const mockEvent = { currentTarget: triggerButton };
    MMMNotionTasks.sendSocketNotification = jest.fn();

    MMMNotionTasks.confirmCloseTask(mockEvent, MMMNotionTasks);

    expect(MMMNotionTasks.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-TodoistTouch-CLOSE-TASK', {
        token: MMMNotionTasks.config.token,
        taskId: '123',
      });
    expect(taskConfirm.style.display).toBe('none');

    document.body.removeChild(li);
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
      tasks: [],
    });
  });

  it('returns template data when not loading', () => {
    MMMNotionTasks.loading = false;

    expect(MMMNotionTasks.getTemplateData()).toEqual({
      loading: false,
      tasks: [],
    });
  });

  it('includes tasks in template data when they are available', () => {
    MMMNotionTasks.loading = false;
    MMMNotionTasks.data.tasks = [{ id: 1, content: 'Test task' }];

    expect(MMMNotionTasks.getTemplateData()).toEqual({
      loading: false,
      tasks: [{ id: 1, content: 'Test task' }],
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
  it('ignores unexpected notifications', () => {
    MMMNotionTasks.socketNotificationReceived('UNEXPECTED_NOTIFICATION', {});

    expect(MMMNotionTasks.loading).toBe(true);
    expect(MMMNotionTasks.data.tasks).toBeUndefined();
  });

  it('updates loading state and data on expected notification', () => {
    const payload = { tasks: [{ id: 1, content: 'Test task' }] };

    MMMNotionTasks.socketNotificationReceived('MMM-TodoistTouch-DATA', payload);

    expect(MMMNotionTasks.loading).toBe(false);
    expect(MMMNotionTasks.data.tasks).toEqual(payload.tasks);
  });
});
