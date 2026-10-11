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
    return this.getDataAndReturn(this.context(payload));
  },

  closeTask (payload) {
    const context = this.context(payload);

    context.api.closeTask(payload.taskId)
      .then(() => this.getDataAndReturn(context));
  },

  createTask (payload) {
    const context = this.context(payload);

    context.api.addTask({
      content: payload.content,
      ...(payload.addTaskArgs ?? {}),
    })
      .then(() => this.getDataAndReturn(context));
  },

  context ({token, filter, identifier, tabs}) {
    return {
      identifier,
      filter,
      tabs,
      api: new TodoistApi(token),
    };
  },

  async getDataAndReturn (context) {
    const tabs = context.tabs || [{ filter: context.filter }];
    const results = await Promise.all(tabs.map(tab => this.getData({
      api: context.api,
      filter: tab.filter,
    })));

    this.sendSocketNotification('MMM-TodoistTouch-DATA', {
      identifier: context.identifier,
      tasks: results,
    });
  },

  async getData ({api, filter}) {
    const { results } = filter
      ? await api.getTasksByFilter({ query: filter })
      : await api.getTasks();

    return results;
  },
});
