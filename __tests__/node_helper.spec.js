let helper;

jest.mock('@doist/todoist-sdk');

let mockApi;

beforeEach(() => {
  jest.clearAllMocks();
  helper = require('../node_helper.js');
  helper.setName('MMM-TodoistTouch');
  mockApi = {
    getTasks: jest.fn().mockResolvedValue({ results: [] }),
    closeTask: jest.fn().mockResolvedValue(),
  };
  helper.api = jest.fn((_token) => mockApi);
});

describe('socketNotificationReceived', () => {
  it('should ignore all other notifications', async () => {
    const mockGetData = jest.fn();
    let oldGetData = helper.getData;
    helper.getData = mockGetData;

    const notification = 'OTHER-NOTIFICATION';

    await helper.socketNotificationReceived(notification, { token: 'test-token' });

    expect(mockGetData).not.toHaveBeenCalled();
    helper.getData = oldGetData; // Restore the original method
  });

  describe('MMM-TodoistTouch-FETCH', () => {
    it('should call getData ', async () => {
      const mockGetData = jest.fn();
      let oldGetData = helper.getData;
      helper.getData = mockGetData;

      const notification = 'MMM-TodoistTouch-FETCH';

      await helper.socketNotificationReceived(notification, { token: 'test-token' });

      expect(mockGetData).toHaveBeenCalled();
      helper.getData = oldGetData; // Restore the original method
    });
  });

  describe('MMM-TodoistTouch-CLOSE-TASK', () => {
    it('should call closeTask and then getData', async () => {
      const mockGetData = jest.fn();
      let oldGetData = helper.getData;
      helper.getData = mockGetData;

      const notification = 'MMM-TodoistTouch-CLOSE-TASK';
      const payload = { token: 'test-token', taskId: 123 };

      await helper.socketNotificationReceived(notification, payload);

      expect(mockApi.closeTask).toHaveBeenCalledWith(payload.taskId);
      expect(mockGetData).toHaveBeenCalled();
      helper.getData = oldGetData; // Restore the original method
    });
  });
});

describe('getData', () => {
  it('should call the API and send socket notification with tasks', async () => {
    const mockSendSocketNotification = jest.fn();
    helper.sendSocketNotification = mockSendSocketNotification;

    const mockTasks = [{ id: 1, content: 'Task 1' }, { id: 2, content: 'Task 2' }];
    mockApi.getTasks.mockResolvedValue({ results: mockTasks });

    await helper.getData(mockApi);

    expect(mockApi.getTasks).toHaveBeenCalled();
    expect(mockSendSocketNotification).toHaveBeenCalledWith('MMM-TodoistTouch-DATA', {
      tasks: mockTasks,
    });
  });
});
