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
      tasks: [
        { content: 'Task 1' },
        { content: 'Task 2' },
      ],
    };
    template = nunjucks.render('MMM-TodoistTouch.njk', data);
  });

  it('shows tasks', () => {
    expect(template).toContain('Task 1');
    expect(template).toContain('Task 2');
  });

  it('trim tasks over 50 characters', () => {
    data.tasks.push({ content: 'This is a very long task that should be trimmed at the 50 character limit' });

    template = nunjucks.render('MMM-TodoistTouch.njk', data);

    expect(template).toContain('This is a very long task that should be trimmed at...');
  });
});

describe('loaded, no tasks present', () => {
  beforeEach(() => {
    data = {
      loading: false,
      tasks: [],
    };
    template = nunjucks.render('MMM-TodoistTouch.njk', data);
  });

  it('shows no tasks message', () => {
    expect(template).toContain('NO_TASKS');
  });
});
