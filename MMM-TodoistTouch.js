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
      //
    });
  },

  getTemplate () {
    return 'MMM-TodoistTouch.njk';
  },

  getTemplateData () {
    return {
      loading: this.loading,
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
    // Update data
    this.updateDom(300);
  },
});
