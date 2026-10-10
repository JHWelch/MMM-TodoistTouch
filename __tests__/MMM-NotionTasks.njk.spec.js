nunjucks = require('../__mocks__/nunjucks');

translate = (str) => str;

let data;
let template;

describe('loading', () => {
  beforeEach(() => {
    data = { loading: true };
    template = nunjucks.render('MMM-TodoistTouch.njk', data);
  });

  it('shows loading', () => {
    expect(template).toContain('LOADING');
  });
});

describe('loaded with tasks', () => {
  beforeEach(() => {
    data = {
      loading: false,
      taskGroups: [[
        { content: 'Task 1' },
        { content: 'Task 2' },
      ]],
    };
    template = nunjucks.render('MMM-TodoistTouch.njk', data);
  });

  it('shows tasks', () => {
    expect(template).toContain('Task 1');
    expect(template).toContain('Task 2');
  });

  it('trim tasks over 50 characters', () => {
    data.taskGroups[0].push({ content: 'This is a very long task that should be trimmed at the 50 character limit' });

    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).toContain('This is a very long task that should be trimmed at...');
  });

  it('does not show the add button if the keyboard is loaded', () => {
    data.hasKeyboard = false;

    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).not.toContain('add-button');
  });

  it('shows the add button if the keyboard is loaded', () => {
    data.hasKeyboard = true;

    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).toContain('add-button');
  });
});

describe('loaded with tabs of tasks', () => {
  beforeEach(() => {
    data = {
      loading: false,
      tabs: ['Tab 1', 'Tab 2'],
      activeTab: '0',
      taskGroups: [
        [
          { content: 'Task 1' },
          { content: 'Task 2' },
        ],
        [
          { content: 'Task 3' },
          { content: 'Task 4' },
        ],
      ],
    };
    template = nunjucks.render('MMM-TodoistTouch.njk', data);
  });

  it('shows tasks', () => {
    expect(template).toContain('Task 1');
    expect(template).toContain('Task 2');
    expect(template).toContain('Task 3');
    expect(template).toContain('Task 4');
  });

  it('trim tasks over 50 characters', () => {
    data.taskGroups[0].push({ content: 'This is a very long task that should be trimmed at the 50 character limit' });

    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).toContain('This is a very long task that should be trimmed at...');
  });

  it('does not show the add button if the keyboard is loaded', () => {
    data.hasKeyboard = false;

    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).not.toContain('add-button');
  });

  it('shows the add button if the keyboard is loaded', () => {
    data.hasKeyboard = true;

    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).toContain('add-button');
  });

  it('shows tabs', () => {
    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).toContain('Tab 1');
    expect(template).toContain('Tab 2');
  });

  it('shows the first tab as active', () => {
    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).toContain('class="list active" data-tab-id="0"');
    expect(template).toContain('class="list" data-tab-id="1"');
  });

  it('can show the second tab as active', () => {
    data.activeTab = '1';

    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).toContain('class="list" data-tab-id="0"');
    expect(template).toContain('class="list active" data-tab-id="1"');
  });
});

describe('loaded, no tasks present', () => {
  beforeEach(() => {
    data = {
      loading: false,
      taskGroups: [[]],
    };
    template = nunjucks.render('MMM-TodoistTouch.njk', data);
  });

  it('shows no tasks message', () => {
    expect(template).toContain('NO_TASKS');
  });

  it('can show no task message from config', () => {
    data.noTasksMessage = 'No tasks to show';
    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).toContain('No tasks to show');
  });
});
