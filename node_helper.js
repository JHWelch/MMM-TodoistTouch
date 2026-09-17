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
    this.getData(this.api(payload.token));
  },

  closeTask (payload) {
    const api = this.api(payload.token);

    api.closeTask(payload.taskId).then(() => {
      this.getData(api);
    });
  },

  createTask (payload) {
    const api = this.api(payload.token);

    api.addTask({ content: payload.content }).then(() => {
      this.getData(api);
    });
  },

  api (token) {
    return new TodoistApi(token);
  },

  async getData (api) {
    const { results } = await api.getTasks();

    this.sendSocketNotification('MMM-TodoistTouch-DATA', {
      tasks: results,
    });
  },
});
