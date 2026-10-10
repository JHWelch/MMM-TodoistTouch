/* global Module */
/* global config */

/* Magic Mirror
 * Module: MMM-TodoistTouch
 *
 * By Jordan Welch
 * MIT Licensed.
 */

Module.register('MMM-TodoistTouch', {
  defaults: {
    updateInterval: 60000,
    addTaskArgs: {},
  },

  requiresVersion: '2.28.0',

  loading: true,

  activeTab: '0',

  start () {
    Log.info(`Starting module: ${this.name}`);
    const self = this;

    this.getData();

    setInterval(() => {
      self.getData();
    }, this.config.updateInterval);
  },

  todoistConfig () {
    return {
      token: this.config.token,
      filter: this.config.filter,
    };
  },

  getData () {
    this.sendSocketNotification('MMM-TodoistTouch-FETCH', {
      ...this.todoistConfig(),
      identifier: this.identifier,
      filter: this.config.filter,
      tabs: this.config.tabs,
    });
  },

  // 1. Bind touch events every time the template renders on screen
  notificationReceived: function (notification, payload, _sender) {
    if (notification === 'MODULE_DOM_UPDATED') {
      this.bindTouchEvents();
    } else if (notification == 'KEYBOARD_INPUT' && payload.key === 'TODOIST_ADD_TASK') {
      this.sendSocketNotification('MMM-TodoistTouch-CREATE-TASK', {
        ...this.todoistConfig(),
        content: payload.message,
        addTaskArgs: this.config.addTaskArgs,
      });
    }
  },

  // 2. Custom routine to handle touch selection on Nunjucks rendered elements
  bindTouchEvents: function () {
    this.bindTouchEvent('.close-button', this.openModal);
    this.bindTouchEvent('.modal-button-confirm', this.confirmCloseTask);
    this.bindTouchEvent('.modal-button-cancel', this.cancelCloseTask);
    this.bindTouchEvent('.add-button', this.openKeyboardForAdd);
    this.bindTouchEvent('.tab-button', this.swapTab);
  },

  openModal (e) {
    const { element, taskId } = this.taskDetails(e);
    const pop = element.querySelector('.task-confirm');
    pop.style.display = 'block';

    if (window.taskTimers) {
      clearTimeout(window.taskTimers[taskId]);
    } else {
      window.taskTimers = {};
    }
    window.taskTimers[taskId] = setTimeout(() => { pop.style.display = 'none'; }, 15000);
  },

  confirmCloseTask (e) {
    const { taskId } = this.taskDetails(e);
    this.sendSocketNotification('MMM-TodoistTouch-CLOSE-TASK', {
      ...this.todoistConfig(),
      taskId: taskId,
    });
    this.cancelCloseTask(e);
  },

  cancelCloseTask  (e) {
    const { element, taskId } = this.taskDetails(e);
    if (window.taskTimers && window.taskTimers[taskId]) {
      clearTimeout(window.taskTimers[taskId]);
    }
    element.querySelector('.task-confirm').style.display='none';
  },

  openKeyboardForAdd () {
    this.sendNotification('KEYBOARD', {
      key: 'TODOIST_ADD_TASK',
      style: 'default',
      sendLabel: 'Add Task',
    });
  },

  swapTab (e) {
    const tabId = e.currentTarget.getAttribute('data-tab-id');
    const lists = document.querySelectorAll('.MMM-TodoistTouch .list');
    const buttons = document.querySelectorAll('.MMM-TodoistTouch .tab-button');

    this.activeTab = tabId;

    lists.forEach(list => {
      if (list.getAttribute('data-tab-id') === tabId) {
        list.classList.add('active');
      } else {
        list.classList.remove('active');
      }
    });

    buttons.forEach(button => {
      if (button.getAttribute('data-tab-id') === tabId) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  },

  getTemplate () {
    return 'MMM-TodoistTouch.njk';
  },

  addTaskLevels (tasks) {
    // Normalize IDs to strings so 10 and "10" don't mismatch.
    const byId = new Map(tasks.map(task => [String(task.id), task]));

    // This function exists only while addTaskLevels is running.
    function getLevel (task, visiting = new Set()) {
      if (task.parentId == null || task.parentId === '') {
        return 0;
      }

      const id = String(task.id);
      const parentId = String(task.parentId);
      // Prevent infinite recursion when records form a loop.
      if (visiting.has(id)) {
        throw new Error(`Circular parent relationship involving task ${id}`);
      }

      const parent = byId.get(parentId);

      // Choose a policy for an orphaned task.
      if (!parent) {
        console.warn(`Task ${id} has missing parent ${parentId}`);

        return 7;
      }
      visiting.add(id);
      const level = getLevel(parent, visiting) + 1;
      visiting.delete(id);

      return level;
    }
    // Mutates the existing task objects by adding task.level.
    for (const task of tasks) {
      task.level = getLevel(task);
    }

    return tasks;

  },

  getTemplateData () {
    return {
      loading: this.loading,
      activeTab: this.activeTab,
      taskGroups: this.data?.tasks || [[]],
      tabs: this.config.tabs?.map(tab => tab.name),
      noTasksMessage: this.config.noTasksMessage,
      hasKeyboard: config.modules
        .map(({module}) => module)
        .includes('MMM-Keyboard'),
    };
  },

  getStyles () {
    return [
      'font-awesome.css',
      'MMM-TodoistTouch.css',
    ];
  },

  getTranslations () {
    return {
      en: 'translations/en.json',
      es: 'translations/es.json',
    };
  },

  socketNotificationReceived (notification, payload) {
    if (
      notification !== 'MMM-TodoistTouch-DATA' ||
      payload.identifier !== this.identifier
    ) {
      return;
    }

    this.loading = false;
    this.data.tasks = payload.tasks;
    this.data.tasks.forEach(task => this.addTaskLevels(task));

    this.updateDom(300);
  },

  ////////////////////////
  // Helpers
  ////////////////////////

  bindTouchEvent (className, callback) {
    const elements = document.querySelectorAll('.MMM-TodoistTouch ' + className);
    if (!elements || !elements.length) return;

    callback = callback.bind(this);

    elements.forEach((element) => {
      element.addEventListener('touchend', callback);
      element.addEventListener('click', callback);
    });
  },

  taskDetails (e) {
    const li = e.currentTarget.closest('li');

    return {
      element: li,
      taskId: li.getAttribute('data-task-id'),
    };
  },
});
