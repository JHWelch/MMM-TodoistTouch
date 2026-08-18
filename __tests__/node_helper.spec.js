let helper;

jest.mock('@doist/todoist-sdk');

const { TodoistApi } = require('@doist/todoist-sdk');

beforeEach(() => {
  jest.clearAllMocks();
  helper = require('../node_helper.js');
  helper.setName('MMM-TodoistTouch');
});

describe('socketNotificationReceived', () => {
  it('should call getData', async () => {
    const mockGetData = jest.fn();
    let oldGetData = helper.getData;
    helper.getData = mockGetData;

    const notification = 'MMM-TodoistTouch-FETCH';

    await helper.socketNotificationReceived(notification, { token: 'test-token' });

    expect(mockGetData).toHaveBeenCalled();
    helper.getData = oldGetData; // Restore the original method
  });
});

describe('getData', () => {
  beforeEach(() => {
    helper.api = new TodoistApi('test-token');
  });

  it('should call the API and send socket notification with tasks', async () => {
    const mockSendSocketNotification = jest.fn();
    helper.sendSocketNotification = mockSendSocketNotification;

    const mockTasks = [{ id: 1, content: 'Task 1' }, { id: 2, content: 'Task 2' }];
    TodoistApi.prototype.getTasks.mockResolvedValue({ results: mockTasks });

    await helper.getData({ token: 'test-token' });

    expect(TodoistApi.mock.instances[0].getTasks).toHaveBeenCalled();
    expect(mockSendSocketNotification).toHaveBeenCalledWith('MMM-TodoistTouch-DATA', {
      tasks: mockTasks,
    });
  });
});
