/** @jest-environment jsdom */

require('../__mocks__/Module');
require('../__mocks__/globalLogger');

const name = 'MMM-TodoistTouch';

let MMMTodoistTouch;

beforeEach(() => {
  jest.resetModules();
  require('../MMM-TodoistTouch');

  MMMTodoistTouch = global.Module.create(name);
  MMMTodoistTouch.setData({ name, identifier: `module_1_${name}` });

  const date = new Date(2023, 9, 1); // October 1, 2023
  jest.useFakeTimers().setSystemTime(date);
});

afterEach(() => {
  jest.useRealTimers();
});

it('has a default config', () => {
  expect(MMMTodoistTouch.defaults).toEqual({
    updateInterval: 60000,
    addTaskArgs: {},
  });
});

it('requires expected version', () => {
  expect(MMMTodoistTouch.requiresVersion).toBe('2.28.0');
});

it('inits module in default state', () => {
  expect(MMMTodoistTouch.loading).toBe(true);
  expect(MMMTodoistTouch.activeTab).toBe('0');
});

describe('start', () => {
  const originalInterval = setInterval;
  const configObject = {
    token: 'test-token',
    filter: 'test-filter',
  };
  let payload;

  beforeEach(() => {
    MMMTodoistTouch.setConfig(configObject);
    global.setInterval = jest.fn();
    MMMTodoistTouch.config.filter = 'test-filter';
    payload = {
      ...configObject,
      identifier: MMMTodoistTouch.identifier,
    };
  });

  afterEach(() => {
    global.setInterval = originalInterval;
  });

  it('logs start of module', () => {
    MMMTodoistTouch.start();

    expect(global.Log.info).toHaveBeenCalledWith('Starting module: MMM-TodoistTouch');
  });

  it('requests data from node_helper with config variables', () => {
    MMMTodoistTouch.start();

    expect(MMMTodoistTouch.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-TodoistTouch-FETCH', payload);
  });

  test('interval requests data from node_helper', () => {
    MMMTodoistTouch.start();
    global.setInterval.mock.calls[0][0]();

    expect(MMMTodoistTouch.sendSocketNotification).toHaveBeenCalledTimes(2);
    expect(MMMTodoistTouch.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-TodoistTouch-FETCH', payload);
  });

  test('interval set starts with default value', () => {
    MMMTodoistTouch.setConfig({ updateInterval: 100000 });
    MMMTodoistTouch.start();

    expect(global.setInterval)
      .toHaveBeenCalledWith(expect.any(Function), 100000);
  });
});

describe('getData', () => {
  it('sends socket notification with config variables', () => {
    MMMTodoistTouch.setConfig({
      token: 'test-token',
      filter: 'test-filter',
    });

    MMMTodoistTouch.getData();

    expect(MMMTodoistTouch.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-TodoistTouch-FETCH', {
        identifier: MMMTodoistTouch.identifier,
        token: 'test-token',
        filter: 'test-filter',
      });
  });

  it('will send tabs if present', () => {
    MMMTodoistTouch.setConfig({
      token: 'test-token',
      tabs: [
        {
          filter: 'test-filter-1',
        },
        {
          filter: 'test-filter-2',
        },
      ],
    });

    MMMTodoistTouch.getData();

    expect(MMMTodoistTouch.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-TodoistTouch-FETCH', {
        identifier: MMMTodoistTouch.identifier,
        token: 'test-token',
        tabs: [
          {
            filter: 'test-filter-1',
          },
          {
            filter: 'test-filter-2',
          },
        ],
      });
  });
});

describe('notificationReceived', () => {
  describe('MODULE_DOM_UPDATED', () => {
    it('does nothing if notification is not MODULE_DOM_UPDATED', () => {
      MMMTodoistTouch.bindTouchEvents = jest.fn();
      MMMTodoistTouch.notificationReceived('SOME_OTHER_NOTIFICATION');

      expect(MMMTodoistTouch.bindTouchEvents).not.toHaveBeenCalled();
    });

    it('binds touch events if notification is MODULE_DOM_UPDATED', () => {
      MMMTodoistTouch.bindTouchEvents = jest.fn();
      MMMTodoistTouch.notificationReceived('MODULE_DOM_UPDATED');

      expect(MMMTodoistTouch.bindTouchEvents).toHaveBeenCalled();
    });
  });
  describe('KEYBOARD_INPUT', () => {
    it('triggers a backend create if notification with key TODOIST_ADD_TASK', () => {
      const payload = { key: 'TODOIST_ADD_TASK', message: 'Test message' };
      MMMTodoistTouch.sendSocketNotification = jest.fn();

      MMMTodoistTouch.notificationReceived('KEYBOARD_INPUT', payload);

      expect(MMMTodoistTouch.sendSocketNotification)
        .toHaveBeenCalledWith('MMM-TodoistTouch-CREATE-TASK', {
          token: MMMTodoistTouch.config.token,
          addTaskArgs: {},
          content: payload.message,
        });
    });

    it('includes extra addTaskArgs if provided in config', () => {
      const payload = { key: 'TODOIST_ADD_TASK', message: 'Test message' };
      MMMTodoistTouch.sendSocketNotification = jest.fn();
      MMMTodoistTouch.config.addTaskArgs = {
        projectId: 'project-id',
        assigneeId: 'assignee-id',
      };

      MMMTodoistTouch.notificationReceived('KEYBOARD_INPUT', payload);

      expect(MMMTodoistTouch.sendSocketNotification)
        .toHaveBeenCalledWith('MMM-TodoistTouch-CREATE-TASK', {
          token: MMMTodoistTouch.config.token,
          content: payload.message,
          addTaskArgs: {
            projectId: 'project-id',
            assigneeId: 'assignee-id',
          },
        });
    });

    it('ignores other keys', () => {
      const payload = { key: 'SOMETHING ELSE', message: 'Test message' };
      MMMTodoistTouch.sendSocketNotification = jest.fn();

      MMMTodoistTouch.notificationReceived('KEYBOARD_INPUT', payload);

      expect(MMMTodoistTouch.sendSocketNotification).not.toHaveBeenCalled();
    });
  });
});

describe('bindTouchEvents', () => {
  beforeEach(() => {
    document.body.className = 'MMM-TodoistTouch'; // Needed for targeting
  });

  it('binds touch events for close button', () => {
    const mockCloseButton = document.createElement('button');
    mockCloseButton.className = 'close-button';
    document.body.appendChild(mockCloseButton);
    MMMTodoistTouch.openModal = jest.fn();

    MMMTodoistTouch.bindTouchEvents();

    mockCloseButton.dispatchEvent(new Event('touchend'));
    expect(MMMTodoistTouch.openModal).toHaveBeenCalled();
  });

  it('binds touch events for modal confirm button', () => {
    const mockConfirmButton = document.createElement('button');
    mockConfirmButton.className = 'modal-button-confirm';
    document.body.appendChild(mockConfirmButton);
    MMMTodoistTouch.confirmCloseTask = jest.fn();

    MMMTodoistTouch.bindTouchEvents();

    mockConfirmButton.dispatchEvent(new Event('click'));
    expect(MMMTodoistTouch.confirmCloseTask).toHaveBeenCalled();
  });

  it('binds touch events for modal cancel button', () => {
    const mockCancelButton = document.createElement('button');
    mockCancelButton.className = 'modal-button-cancel';
    document.body.appendChild(mockCancelButton);
    MMMTodoistTouch.cancelCloseTask = jest.fn();

    MMMTodoistTouch.bindTouchEvents();

    mockCancelButton.dispatchEvent(new Event('touchend'));
    expect(MMMTodoistTouch.cancelCloseTask).toHaveBeenCalled();
  });

  it('binds touch events for add button', () => {
    const mockAddButton = document.createElement('button');
    mockAddButton.className = 'add-button';
    document.body.appendChild(mockAddButton);
    MMMTodoistTouch.openKeyboardForAdd = jest.fn();

    MMMTodoistTouch.bindTouchEvents();

    mockAddButton.dispatchEvent(new Event('click'));
    expect(MMMTodoistTouch.openKeyboardForAdd).toHaveBeenCalled();
  });
});

describe('bindTouchEvent', () => {
  it('binds touchend and click events to elements with the given class', () => {
    const mockElement = document.createElement('div');
    mockElement.className = 'test-class';
    document.body.appendChild(mockElement);

    const callback = jest.fn();
    MMMTodoistTouch.bindTouchEvent('.test-class', callback);

    mockElement.dispatchEvent(new Event('touchend'));
    mockElement.dispatchEvent(new Event('click'));

    expect(callback).toHaveBeenCalledTimes(2);

    document.body.removeChild(mockElement);
  });
});

describe('swapTab', () => {
  let tabButton;

  beforeEach(() => {
    tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.setAttribute('data-tab-id', '1');
  });

  it('activates selected tab list and deactivates others', () => {
    const tab0 = document.createElement('div');
    tab0.className = 'list';
    tab0.setAttribute('data-tab-id', '0');
    const tab1 = document.createElement('div');
    tab1.className = 'list';
    tab1.setAttribute('data-tab-id', '1');

    document.body.appendChild(tab0);
    document.body.appendChild(tab1);

    MMMTodoistTouch.swapTab({ currentTarget: tabButton });

    expect(tab0.classList.contains('active')).toBe(false);
    expect(tab1.classList.contains('active')).toBe(true);
  });

  it('activates selected tab button and deactivates others', () => {
    const otherTabButton = document.createElement('button');
    otherTabButton.className = 'tab-button active';
    otherTabButton.setAttribute('data-tab-id', '0');

    document.body.appendChild(tabButton);
    document.body.appendChild(otherTabButton);

    MMMTodoistTouch.swapTab({ currentTarget: tabButton });

    expect(tabButton.classList.contains('active')).toBe(true);
    expect(otherTabButton.classList.contains('active')).toBe(false);
  });

  it('tracks active tab in module', () => {
    MMMTodoistTouch.swapTab({ currentTarget: tabButton });

    expect(MMMTodoistTouch.activeTab).toBe('1');
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
    MMMTodoistTouch.sendSocketNotification = jest.fn();

    MMMTodoistTouch.confirmCloseTask(mockEvent, MMMTodoistTouch);

    expect(MMMTodoistTouch.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-TodoistTouch-CLOSE-TASK', {
        token: MMMTodoistTouch.config.token,
        taskId: '123',
      });
    expect(taskConfirm.style.display).toBe('none');

    document.body.removeChild(li);
  });
});

describe('openKeyboardForAdd', () => {
  it('sends keyboard notification', () => {
    MMMTodoistTouch.sendNotification = jest.fn();

    MMMTodoistTouch.openKeyboardForAdd(MMMTodoistTouch);

    expect(MMMTodoistTouch.sendNotification).toHaveBeenCalledWith('KEYBOARD', {
      key: 'TODOIST_ADD_TASK',
      style: 'default',
      sendLabel: 'Add Task',
    });
  });
});

describe('getTemplate', () => {
  it('returns template path', () => {
    expect(MMMTodoistTouch.getTemplate()).toBe('MMM-TodoistTouch.njk');
  });
});

describe('getTemplateData', () => {
  afterEach(() => {
    global.config.modules = [];
  });

  it('returns template data when loading', () => {
    expect(MMMTodoistTouch.getTemplateData()).toEqual({
      loading: true,
      taskGroups: [[]],
      noTasksMessage: undefined,
      hasKeyboard: false,
      activeTab: '0',
    });
  });

  it('returns template data when not loading', () => {
    MMMTodoistTouch.loading = false;

    expect(MMMTodoistTouch.getTemplateData()).toEqual({
      loading: false,
      taskGroups: [[]],
      noTasksMessage: undefined,
      hasKeyboard: false,
      activeTab: '0',
    });
  });

  it('includes tasks in template data when they are available', () => {
    MMMTodoistTouch.loading = false;
    MMMTodoistTouch.data.tasks = [{ id: 1, content: 'Test task' }];

    expect(MMMTodoistTouch.getTemplateData()).toEqual({
      loading: false,
      taskGroups: [{ id: 1, content: 'Test task' }],
      noTasksMessage: undefined,
      hasKeyboard: false,
      activeTab: '0',
    });
  });

  it('includes noTasksMessage in template data when it is set in config', () => {
    MMMTodoistTouch.loading = false;
    MMMTodoistTouch.config.noTasksMessage = 'No tasks available';

    expect(MMMTodoistTouch.getTemplateData()).toEqual({
      loading: false,
      taskGroups: [[]],
      noTasksMessage: 'No tasks available',
      hasKeyboard: false,
      activeTab: '0',
    });
  });

  it('toggles hasKeyboard if MMM-Keyboard is loaded', () => {
    global.config.modules = [
      {module: 'MMM-Keyboard'},
    ];
    MMMTodoistTouch.loading = false;

    expect(MMMTodoistTouch.getTemplateData()).toEqual({
      loading: false,
      taskGroups: [[]],
      hasKeyboard: true,
      activeTab: '0',
    });
  });

  it('can populate data for tabs', () => {
    MMMTodoistTouch.loading = false;
    MMMTodoistTouch.data.tasks = [
      { id: 1, content: 'Test task1' },
      { id: 2, content: 'Test task2' },
    ];
    MMMTodoistTouch.config.tabs = [
      {
        name: 'Tab 1',
        filter: 'test-filter-1',
      },
      {
        name: 'Tab 2',
        filter: 'test-filter-2',
      },
    ];

    expect(MMMTodoistTouch.getTemplateData()).toEqual({
      loading: false,
      taskGroups: [
        { id: 1, content: 'Test task1' },
        { id: 2, content: 'Test task2' },
      ],
      tabs: [
        'Tab 1',
        'Tab 2',
      ],
      hasKeyboard: false,
      activeTab: '0',
    });
  });

  it('passes activeTab', () => {
    MMMTodoistTouch.activeTab = '1';

    expect(MMMTodoistTouch.getTemplateData()).toEqual({
      loading: true,
      taskGroups: [[]],
      hasKeyboard: false,
      activeTab: '1',
    });
  });
});

describe('getStyles', () => {
  it('returns styles path', () => {
    expect(MMMTodoistTouch.getStyles()).toEqual([
      'font-awesome.css',
      'MMM-TodoistTouch.css',
    ]);
  });
});

describe('socketNotificationReceived', () => {
  let payload;

  beforeEach(() => {
    payload = {
      tasks: [[{ id: 1, content: 'Test task' }]],
      identifier: MMMTodoistTouch.identifier,
    };
  });

  it('ignores unexpected notifications', () => {
    MMMTodoistTouch.socketNotificationReceived('UNEXPECTED_NOTIFICATION', payload);

    expect(MMMTodoistTouch.loading).toBe(true);
    expect(MMMTodoistTouch.data.tasks).toBeUndefined();
  });

  it('ignores notifications with unexpected identifier', () => {
    const wrongIdentifierPayload = {
      ...payload,
      identifier: 'wrong_identifier',
    };

    MMMTodoistTouch.socketNotificationReceived('MMM-TodoistTouch-DATA', wrongIdentifierPayload);

    expect(MMMTodoistTouch.loading).toBe(true);
    expect(MMMTodoistTouch.data.tasks).toBeUndefined();
  });

  it('updates loading state and data on expected notification', () => {
    const addTaskLevelsSpy = jest.spyOn(MMMTodoistTouch, 'addTaskLevels');

    MMMTodoistTouch.socketNotificationReceived('MMM-TodoistTouch-DATA', payload);

    expect(MMMTodoistTouch.loading).toBe(false);
    expect(MMMTodoistTouch.data.tasks).toEqual(payload.tasks);
    expect(addTaskLevelsSpy).toHaveBeenCalledWith(payload.tasks[0]);
  });

  it('can load data back from tabs', () => {
    const addTaskLevelsSpy = jest.spyOn(MMMTodoistTouch, 'addTaskLevels');
    payload.tasks = [
      [{ id: 1, content: 'Test task 1' }],
      [{ id: 2, content: 'Test task 2' }],
    ];

    MMMTodoistTouch.socketNotificationReceived('MMM-TodoistTouch-DATA', payload);

    expect(MMMTodoistTouch.loading).toBe(false);
    expect(MMMTodoistTouch.data.tasks).toEqual(payload.tasks);
    expect(addTaskLevelsSpy).toHaveBeenCalledWith(payload.tasks[0]);
    expect(addTaskLevelsSpy).toHaveBeenCalledWith(payload.tasks[1]);
  });
});
