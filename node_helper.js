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
    if (notification === 'MMM-TodoistTouch-FETCH') {
      this.getData(this.api(payload.token));
    } else if (notification === 'MMM-TodoistTouch-CLOSE-TASK') {
      const api = this.api(payload.token);

      api.closeTask(payload.taskId).then(() => {
        this.getData(api);
      });
    }
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
