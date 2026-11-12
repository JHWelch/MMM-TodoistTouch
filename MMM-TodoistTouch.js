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

  autoTabIntervalId: null,

  start () {
    Log.info(`Starting module: ${this.name}`);
    const self = this;

    this.getData();

    setInterval(() => {
      self.getData();
    }, this.config.updateInterval);

    this.unpauseAutoTab();
  },

  getData () {
    this.sendSocketNotification('MMM-TodoistTouch-FETCH', this.commonPayload());
  },

  handleAutoTab () {
    if (!this.autoTabIntervalId) { return; }

    switch (this.config.autoTabMode) {
      case 'return-home': {
        if (this.activeTab === '0') {
          break;
        }

        this.swapTab('0');
        break;
      }
      case 'advance': {
        const totalTabs = (this.config.tabs ?? []).length;
        const activeTab = parseInt(this.activeTab);
        const targetTab = (activeTab + 1) % totalTabs;

        this.swapTab(targetTab.toString());
        break;
      }
    }
  },

  // 1. Bind touch events every time the template renders on screen
  notificationReceived: function (notification, payload, _sender) {
    if (notification === 'MODULE_DOM_UPDATED') {
      this.bindTouchEvents();
      this.unpauseAutoTab();
    } else if (notification == 'KEYBOARD_INPUT' && payload.key === 'TODOIST_ADD_TASK') {
      const tabOverrides = {};

      // Get tab specific overrides
      if (this.config.tabs?.length) {
        const { tabId } = payload.data;
        const tab = this.config.tabs[parseInt(tabId)];
        if (tab.addTaskArgs) {
          tabOverrides.addTaskArgs = tab.addTaskArgs;
        }
      }

      this.sendSocketNotification('MMM-TodoistTouch-CREATE-TASK', {
        ...this.commonPayload(),
        content: payload.message,
        addTaskArgs: this.config.addTaskArgs,
        ...tabOverrides,
      });
      this.unpauseAutoTab();
    } 
    // === NEW LOGIC FOR HANDLING UPDATES ===
    else if (notification == 'KEYBOARD_INPUT' && payload.key === 'TODOIST_UPDATE_TASK') {
      const { taskId } = payload.data; // Extract the specific task ID we passed to the keyboard

      this.sendSocketNotification('MMM-TodoistTouch-UPDATE-TASK', {
        ...this.commonPayload(),
        taskId: taskId,
        content: payload.message, // The new edited text you typed into the keyboard
      });
      this.unpauseAutoTab();
    } 
    // ======================================
    else if (notification === 'KEYBOARD_CLOSED' && (payload.key === 'TODOIST_ADD_TASK' || payload.key === 'TODOIST_UPDATE_TASK')) {
      this.pauseAutoTab();
      this.unpauseAutoTab();
    }
  },

  // 2. Custom routine to handle touch selection on Nunjucks rendered elements
    bindTouchEvents: function () {
    // Short press -> openModal | Long press -> openKeyboardForUpdate
    this.bindTouchEvent('.close-button', this.openModal, this.openKeyboardForUpdate);
    
    this.bindTouchEvent('.modal-button-confirm', this.confirmCloseTask);
    this.bindTouchEvent('.modal-button-cancel', this.cancelCloseTask);
    this.bindTouchEvent('.add-button', this.openKeyboardForAdd);
    this.bindTouchEvent('.tab-button', this.userSwapTab);
  },

  openModal (e) {
    this.pauseAutoTab();
    const { taskContainer, taskId } = this.taskDetails(e);
    const pop = taskContainer.querySelector('.task-confirm');
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
      ...this.commonPayload(),
      taskId: taskId,
    });
    this.cancelCloseTask(e);
  },

  cancelCloseTask  (e) {
    const { taskContainer, taskId } = this.taskDetails(e);
    if (window.taskTimers && window.taskTimers[taskId]) {
      clearTimeout(window.taskTimers[taskId]);
    }
    taskContainer.querySelector('.task-confirm').style.display='none';
    this.unpauseAutoTab();
  },

  openKeyboardForAdd (e) {
    this.pauseAutoTab();
    const { tabId } = this.taskDetails(e);

    this.sendNotification('KEYBOARD', {
      key: 'TODOIST_ADD_TASK',
      style: 'default',
      sendLabel: 'Add\u00A0Task',
      data: { tabId },
    });
  },

  openKeyboardForUpdate: function (e) {
    this.pauseAutoTab();
    const { taskContainer, tabId, taskId } = this.taskDetails(e);

    // 1. Target the exact Nunjucks class that holds your task content text
    const contentElement = taskContainer.querySelector('.task-confirm-content');
    
    // 2. Extract just that clean text string, stripping away any extra spaces
    const existingText = contentElement ? contentElement.textContent.trim() : "";

    // 3. Send the clean value to the touchscreen keyboard
    this.sendNotification('KEYBOARD', {
      key: 'TODOIST_UPDATE_TASK',
      style: 'default',
      sendLabel: 'Update',
      value: existingText, 
      data: { 
        tabId: tabId,
        taskId: taskId 
      },
    });
  },

  userSwapTab (e) {
    const tabId = e.currentTarget.getAttribute('data-tab-id');

    this.swapTab(tabId);
    this.pauseAutoTab();
    this.unpauseAutoTab();
  },

  swapTab (tabId) {
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



/*  addTaskLevels (tasks) {
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

  }, */

  sortTasks(tasks) {
    const map = new Map();
    const roots = [];

    // 1. Index all tasks by normalized string ID
    for (const task of tasks) {
      const id = String(task.id).trim();
      map.set(id, { task, children: [] });
    }

    // 2. Attach subtasks to their parent task
    for (const task of tasks) {
      const id = String(task.id).trim();
      const parentId = task.parentId ? String(task.parentId).trim() : null;
      const node = map.get(id);

      if (parentId && map.has(parentId)) {
        map.get(parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    // 3. Traverse in hierarchy order and collect original task objects
    const sorted = [];
    function traverse(nodes, level = 0) {
      nodes.sort((a, b) => {
        const orderA = a.task.childOrder ?? a.task.order ?? 0;
        const orderB = b.task.childOrder ?? b.task.order ?? 0;
        return orderA - orderB;
      });

      for (const node of nodes) {
        node.task.level = level; // Optional: attaches nesting level directly to each task
        sorted.push(node.task);
        if (node.children.length > 0) {
          traverse(node.children, level + 1);
        }
      }
    }

    traverse(roots);

    // 4. Overwrite the original `tasks` array 
    tasks.splice(0, tasks.length, ...sorted);
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
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.loading = false;
    this.data.tasks = payload.tasks;
    this.data.tasks.forEach(task => this.sortTasks(task));
    this.updateDom(300);
  },

  ////////////////////////
  // Helpers
  ////////////////////////

  commonPayload () {
    return {
      identifier: this.identifier,
      token: this.config.token,
      filter: this.config.filter,
      tabs: this.config.tabs,
    };
  },

bindTouchEvent (className, shortPressCallback, longPressCallback) {
    const elements = document.querySelectorAll('.MMM-TodoistTouch ' + className);
    if (!elements || !elements.length) return;

    shortPressCallback = shortPressCallback.bind(this);
    if (longPressCallback) {
        longPressCallback = longPressCallback.bind(this);
    }

    elements.forEach((element) => {
        let pressTimer = null;
        let longPressTriggered = false;

        element.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            
            longPressTriggered = false;

            // 🌟 VISUAL FEEDBACK: Shrink and dim the moment the finger hits the glass
            this.addPressFeedback(element);

            // Your optimized 600ms timer
            pressTimer = setTimeout(() => {
                longPressTriggered = true;
                
                // 🌟 FIX: Punch the button outward to 105% and brighten it up instantly
                element.style.transform = "scale(1.05)";
                element.style.opacity = "1";

                // Give it 150ms to physically expand, then smoothly slide back to normal size
                setTimeout(() => {
                    this.clearPressFeedback(element);
                }, 150);

                if (longPressCallback) {
                    longPressCallback({ currentTarget: element, target: element });
                }
            }, 600); 
        });

        element.addEventListener('pointerup', (e) => {
            clearTimeout(pressTimer);

            if (longPressTriggered) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // 🌟 VISUAL FEEDBACK: Clear feedback on a regular quick tap
            this.clearPressFeedback(element);
            shortPressCallback({ currentTarget: element, target: element });
        });

        // 🌟 VISUAL FEEDBACK: Safely reset if the user slides their finger off the button
        element.addEventListener('pointercancel', () => {
            clearTimeout(pressTimer);
            this.clearPressFeedback(element);
        });
        element.addEventListener('pointerleave', () => {
            clearTimeout(pressTimer);
            this.clearPressFeedback(element);
        });

        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
},

  addPressFeedback: function (element) {
    if (!element) return;
    element.style.transition = "transform 0.15s ease, opacity 0.15s ease";
    element.style.transform = "scale(0.92)"; // Shrinks slightly into the glass
    element.style.opacity = "0.6";           // Dims slightly to show it's active
  },

  clearPressFeedback: function (element) {
    if (!element) return;
    element.style.transform = "none";
    element.style.opacity = "1";
  },

  taskDetails (e) {
    const taskContainer = e.currentTarget.closest('li');
    const taskList = taskContainer.closest('ul');

    return {
      taskContainer,
      taskList,
      taskId: taskContainer.getAttribute('data-task-id'),
      tabId: taskList.getAttribute('data-tab-id'),
    };
  },

  unpauseAutoTab () {
    if (!this.config.autoTabMode) { return; }
    if (this.autoTabIntervalId) { return; }

    const self = this;

    this.autoTabIntervalId = setInterval(() => {
      self.handleAutoTab();
    }, this.config.autoTabInterval);
  },

  pauseAutoTab () {
    if (!this.autoTabIntervalId) { return; }

    clearInterval(this.autoTabIntervalId);

    this.autoTabIntervalId = null;
  },
});
