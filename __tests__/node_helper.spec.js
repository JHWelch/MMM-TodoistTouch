let helper;

jest.mock('@doist/todoist-sdk');

let mockApi;
let oldGetData;

beforeEach(() => {
  jest.clearAllMocks();
  helper = require('../node_helper.js');
  helper.setName('MMM-TodoistTouch');
  mockApi = {
    getTasks: jest.fn().mockResolvedValue({ results: [] }),
    getTasksByFilter: jest.fn().mockResolvedValue({ results: [] }),
    closeTask: jest.fn().mockResolvedValue(),
    addTask: jest.fn().mockResolvedValue(),
  };
  helper.context = jest.fn((payload) => ({
    api: mockApi,
    filter: payload.filter,
  }));
  oldGetData = helper.getData;
});

afterEach(() => {
  helper.getData = oldGetData; // Restore the original method
});

describe('socketNotificationReceived', () => {
  it('should ignore all other notifications', async () => {
    const mockGetData = jest.fn();
    helper.getData = mockGetData;

    const notification = 'OTHER-NOTIFICATION';

    await helper.socketNotificationReceived(notification, { token: 'test-token' });

    expect(mockGetData).not.toHaveBeenCalled();
  });

  describe('MMM-TodoistTouch-FETCH', () => {
    it('should call getData ', async () => {
      const mockGetData = jest.fn();
      helper.getData = mockGetData;

      const notification = 'MMM-TodoistTouch-FETCH';

      await helper.socketNotificationReceived(notification, { token: 'test-token' });

      expect(mockGetData).toHaveBeenCalled();
    });
  });

  describe('MMM-TodoistTouch-CLOSE-TASK', () => {
    it('should call closeTask and then getData', async () => {
      const mockGetData = jest.fn();
      helper.getData = mockGetData;

      const notification = 'MMM-TodoistTouch-CLOSE-TASK';
      const payload = { token: 'test-token', taskId: 123 };

      await helper.socketNotificationReceived(notification, payload);

      expect(mockApi.closeTask).toHaveBeenCalledWith(payload.taskId);
      expect(mockGetData).toHaveBeenCalled();
    });
  });

  describe('MMM-TodoistTouch-CREATE-TASK', () => {
    it('should call addTask and then getData', async () => {
      const mockGetData = jest.fn();
      helper.getData = mockGetData;

      const notification = 'MMM-TodoistTouch-CREATE-TASK';
      const payload = { token: 'test-token', content: 'New Task' };

      await helper.socketNotificationReceived(notification, payload);

      expect(mockApi.addTask)
        .toHaveBeenCalledWith({ content: payload.content });
      expect(mockGetData).toHaveBeenCalled();
    });
  });
});

describe('getData', () => {
  it('should call the API and send socket notification with tasks', async () => {
    const mockSendSocketNotification = jest.fn();
    helper.sendSocketNotification = mockSendSocketNotification;

    const mockTasks = [{ id: 1, content: 'Task 1' }, { id: 2, content: 'Task 2' }];
    mockApi.getTasks.mockResolvedValue({ results: mockTasks });

    await helper.getData({api: mockApi});

    expect(mockApi.getTasks).toHaveBeenCalled();
    expect(mockSendSocketNotification).toHaveBeenCalledWith('MMM-TodoistTouch-DATA', {
      tasks: mockTasks,
    });
  });

  it('should call filter endpoint if filter is provided', async () => {
    const mockSendSocketNotification = jest.fn();
    helper.sendSocketNotification = mockSendSocketNotification;

    const mockTasks = [{ id: 1, content: 'Task 1' }];
    mockApi.getTasksByFilter.mockResolvedValue({ results: mockTasks });

    await helper.getData({api: mockApi, filter: 'test-filter' });

    expect(mockApi.getTasksByFilter)
      .toHaveBeenCalledWith({query: 'test-filter'});
    expect(mockSendSocketNotification)
      .toHaveBeenCalledWith('MMM-TodoistTouch-DATA', {
        tasks: mockTasks,
      });
  });
});
