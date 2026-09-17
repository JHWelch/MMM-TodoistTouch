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
    confirmText: 'Task Complete?',
    timeout: 10000,
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
    });
  },

  // 1. Bind touch events every time the template renders on screen
  notificationReceived: function (notification, _payload, _sender) {
    if (notification === 'MODULE_DOM_UPDATED') {
      this.bindTouchEvents();
    }
  },

  // 2. Custom routine to handle touch selection on Nunjucks rendered elements
  bindTouchEvents: function () {
    const closeButtons = document.querySelectorAll('.close-button');
    const openModal = (e) => {
      const li = e.currentTarget.closest('li');
      const taskId = li.getAttribute('data-task-id');
      const pop = li.querySelector('.task-confirm');
      pop.style.display = 'block';
      if (window.taskTimers) {
        clearTimeout(window.taskTimers[taskId]);
      } else {
        window.taskTimers = {};
      }
      window.taskTimers[taskId] = setTimeout(() => { pop.style.display = 'none'; }, 15000);
    };
    this.bindTouchEvent(closeButtons, openModal);

    const modalConfirmButtons = document.querySelectorAll('.modal-button-confirm');
    const confirmCloseTask = (e) => {
      const li = e.currentTarget.closest('li');
      const taskId = li.getAttribute('data-task-id');
      if (window.taskTimers && window.taskTimers[ taskId ]) {
        clearTimeout(window.taskTimers[taskId]);
      }
      li.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
      li.querySelector('.task-confirm').style.display='none';
    };
    this.bindTouchEvent(modalConfirmButtons, confirmCloseTask);

    const modalCancelButtons = document.querySelectorAll('.modal-button-cancel');
    const cancelCloseTask = (e) => {
      const li = e.currentTarget.closest('li');
      const taskId = li.getAttribute('data-task-id');
      if (window.taskTimers && window.taskTimers[taskId]) {
        clearTimeout(window.taskTimers[taskId]);
      }
      li.querySelector('.task-confirm').style.display='none';
    };
    this.bindTouchEvent(modalCancelButtons, cancelCloseTask);
  },

  bindTouchEvent (elements, callback) {
    if (!elements || !elements.length) return;

    elements.forEach((element) => {
      element.addEventListener('touchend', callback);
      element.addEventListener('click', callback);
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
    Log.log('Data removed: ' + payload.id);

    this.updateDom(300);
  },
});
