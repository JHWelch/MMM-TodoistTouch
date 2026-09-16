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
});
