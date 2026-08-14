/* Magic Mirror
 * Node Helper: MMM-TodoistTouch
 *
 * By Jordan Welch
 * MIT Licensed.
 */

// const Log = require('logger');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  socketNotificationReceived (notification, payload) {
    if (notification !== 'MMM-TodoistTouch-FETCH') {
      return;
    }

    this.getData(payload);
  },

  async getData ({
    //
  }) {
    this.sendSocketNotification('MMM-TodoistTouch-DATA', {
      //
    });
  },
});
