/* global Module */

/* Magic Mirror
 * Module: MMM-TodoistTouch
 *
 * By Jordan Welch
 * MIT Licensed.
 */

Module.register('MMM-TodoistTouch', {
  defaults: {
    updateInterval: 60000,
  },

  requiresVersion: '2.28.0',

  loading: true,

  start () {
    Log.info(`Starting module: ${this.name}`);
    const self = this;

    this.getData();

    setInterval(() => {
      self.getData();
    }, this.config.updateInterval);
  },

  getData () {
    this.sendSocketNotification('MMM-TodoistTouch-FETCH', {
      token: this.config.token,
      filter: this.config.filter,
    });
  },

  // 1. Bind touch events every time the template renders on screen
  notificationReceived: function (notification, payload, _sender) {
    if (notification === 'MODULE_DOM_UPDATED') {
      this.bindTouchEvents();
    } else if (notification == 'KEYBOARD_INPUT' && payload.key === 'TODOIST_ADD_TASK') {
      this.sendSocketNotification('MMM-TodoistTouch-CREATE-TASK', {
        token: this.config.token,
        content: payload.message,
      });
    }
  },

  // 2. Custom routine to handle touch selection on Nunjucks rendered elements
  bindTouchEvents: function () {
    this.bindTouchEvent('.close-button', this.openModal);
    this.bindTouchEvent('.modal-button-confirm', (e) => this.confirmCloseTask(e, this));
    this.bindTouchEvent('.modal-button-cancel', this.cancelCloseTask);
    this.bindTouchEvent('.add-button', () => this.openKeyboardForAdd(this));
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

  confirmCloseTask (e, self) {
    const { taskId } = self.taskDetails(e);
    this.sendSocketNotification('MMM-TodoistTouch-CLOSE-TASK', {
      token: self.config.token,
      taskId: taskId,
    });
    self.cancelCloseTask(e);
  },

  cancelCloseTask  (e) {
    const { element, taskId } = this.taskDetails(e);
    if (window.taskTimers && window.taskTimers[taskId]) {
      clearTimeout(window.taskTimers[taskId]);
    }
    element.querySelector('.task-confirm').style.display='none';
  },

  openKeyboardForAdd (self) {
    self.sendNotification('KEYBOARD', {
      key: 'TODOIST_ADD_TASK',
      style: 'default',
      data: {},
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
      tasks: this.data?.tasks || [],
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
    if (notification !== 'MMM-TodoistTouch-DATA') {
      return;
    }

    this.loading = false;
    this.data.tasks = payload.tasks;
    this.addTaskLevels(this.data.tasks);

    this.updateDom(300);
  },

  ////////////////////////
  // Helpers
  ////////////////////////

  bindTouchEvent (className, callback) {
    const elements = document.querySelectorAll(className);
    if (!elements || !elements.length) return;

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
