/* Magic Mirror
 * Node Helper: MMM-TodoistTouch
 *
 * By Jordan Welch
 * MIT Licensed.
 */

// const Log = require('logger');
const { TodoistApi } = require('@doist/todoist-sdk');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case 'MMM-TodoistTouch-FETCH': this.fetchData(payload); break;
      case 'MMM-TodoistTouch-CLOSE-TASK': this.closeTask(payload); break;
      case 'MMM-TodoistTouch-CREATE-TASK': this.createTask(payload); break;
    }
  },

  fetchData (payload) {
    this.getData(this.context(payload));
  },

  closeTask (payload) {
    const context = this.context(payload);

    context.api.closeTask(payload.taskId)
      .then(() => this.getData(context));
  },

  createTask (payload) {
    const context = this.context(payload);

    context.api.addTask({ content: payload.content })
      .then(() => this.getData(context));
  },

  context ({token, filter}) {
    return {
      api: new TodoistApi(token),
      filter,
    };
  },

  async getData ({api, filter}) {
    const { results } = filter
      ? await api.getTasksByFilter({ query: filter })
      : await api.getTasks();

    this.sendSocketNotification('MMM-TodoistTouch-DATA', {
      tasks: results,
    });
  },
});
