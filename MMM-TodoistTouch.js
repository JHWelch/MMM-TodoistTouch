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
    if (notification === 'DOM_OBJECTS_CREATED') {
      this.bindTouchEvents();
    }
  },

  // 2. Custom routine to handle touch selection on Nunjucks rendered elements
  bindTouchEvents: function () {
    const deleteBtn = document.querySelector('.delete-trigger-btn');
    const overlay = document.getElementById('dc-overlay');
    const cancelBtn = document.getElementById('dc-cancel-btn');
    const confirmBtn = document.getElementById('dc-confirm-btn');

    if (!deleteBtn || !overlay) return; // Guard clause if elements aren't rendered yet

    // Current targeted item tracker storage
    let activeItemId = null;
    let closeTimer = null;

    const openOverlay = (e) => {
      if (e) e.preventDefault();
      activeItemId = deleteBtn.getAttribute('data-item-id');
      overlay.classList.remove('dc-hidden');

      // Auto-dismiss safety window timer (10 seconds)
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => { closeOverlay(); }, 10000);
    };

    const closeOverlay = (e) => {
      if (e) e.preventDefault();
      overlay.classList.add('dc-hidden');
      clearTimeout(closeTimer);
    };

    // Trigger button actions
    deleteBtn.addEventListener('touchend', openOverlay);
    deleteBtn.addEventListener('click', openOverlay);

    // Overlay cancel buttons
    cancelBtn.addEventListener('touchend', closeOverlay);
    cancelBtn.addEventListener('click', closeOverlay);

    // Overlay confirm buttons
    const executeDelete = (e) => {
      if (e) e.preventDefault();
      // Dispatch payload cleanly to backend node_helper.js
      this.sendSocketNotification('REQUEST_DELETE_DATA', { id: activeItemId });
      closeOverlay();
    };
    confirmBtn.addEventListener('touchend', executeDelete);
    confirmBtn.addEventListener('click', executeDelete);
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
