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
  api: undefined,

  start () {
    this.expressApp.post('/task/:taskId/close', async (req, res) => {
      if (!this.api) {
        return;
      }

      await this.api.closeTask(req.params.taskId);

      res.status(200).send('OK');

      await this.getData();
    });
  },

  socketNotificationReceived (notification, payload) {
    if (notification !== 'MMM-TodoistTouch-FETCH') {
      return;
    }
    this.api = new TodoistApi(payload.token);

    this.getData();
  },

  async getData () {
    const { results } = await this.api.getTasks();

    this.sendSocketNotification('MMM-TodoistTouch-DATA', {
      tasks: results,
    });
  },
});
