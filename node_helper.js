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
    if (notification !== 'MMM-TodoistTouch-FETCH') {
      return;
    }

    this.getData(payload);
  },

  async getData ({
    token,
  }) {
    const api = new TodoistApi(token);

    const { results } = await api.getTasks();

    this.sendSocketNotification('MMM-TodoistTouch-DATA', {
      tasks: results,
    });
  },
});
