let helper;

beforeEach(() => {
  helper = require('../node_helper.js');
  helper.setName('MMM-TodoistTouch');
});

describe('socketNotificationReceived', () => {
  test('todo', () => {expect(true).toBe(true);});
});
