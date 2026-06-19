import { getFirstFocusableElement } from './focusTrap';

describe('getFirstFocusableElement', () => {
  it('returns document.body when the container has no focusable elements', () => {
    const container = document.createElement('div');

    container.innerHTML = '<span>plain text</span><p>paragraph</p>';

    expect(getFirstFocusableElement(container)).toStrictEqual(document.body);
  });

  it('returns document.body when no element argument is provided and document has no focusable elements', () => {
    expect(getFirstFocusableElement()).toStrictEqual(document.body);
  });

  it.each([
    {
      desc: 'button',
      html: '<button>click me</button>',
    },
    {
      desc: 'anchor',
      html: '<a href="#">link</a>',
    },
    {
      desc: 'input',
      html: '<input type="text">',
    },
    {
      desc: 'textarea',
      html: '<textarea></textarea>',
    },
    {
      desc: 'select',
      html: '<select><option>opt</option></select>',
    },
    {
      desc: 'details',
      html: '<details><summary>summary</summary></details>',
    },
    {
      desc: 'element with tabindex="0"',
      html: '<div tabindex="0">div</div>',
    },
    {
      desc: 'element with tabindex="1"',
      html: '<div tabindex="1">div</div>',
    },
  ])('returns the $desc element when it is the only focusable element', ({ html }) => {
    const container = document.createElement('div');

    container.innerHTML = html;

    const expected = container.firstElementChild;

    expect(getFirstFocusableElement(container)).toStrictEqual(expected);
  });

  it('skips a disabled button and returns the next non-disabled focusable element', () => {
    const container = document.createElement('div');

    container.innerHTML = '<button disabled>disabled</button><button>enabled</button>';
    const buttons = container.querySelectorAll('button');

    expect(getFirstFocusableElement(container)).toStrictEqual(buttons[1]);
  });

  it('skips a disabled input and returns the next non-disabled focusable element', () => {
    const container = document.createElement('div');

    container.innerHTML = '<input disabled type="text"><button>submit</button>';
    const button = container.querySelector('button');

    expect(getFirstFocusableElement(container)).toStrictEqual(button);
  });

  it('returns document.body when every focusable element is disabled', () => {
    const container = document.createElement('div');

    container.innerHTML = '<button disabled>a</button><input disabled type="text"><select disabled><option>x</option></select>';

    expect(getFirstFocusableElement(container)).toStrictEqual(document.body);
  });

  it('does not return an element with tabindex="-1"', () => {
    const container = document.createElement('div');

    container.innerHTML = '<div tabindex="-1">not focusable</div>';

    expect(getFirstFocusableElement(container)).toStrictEqual(document.body);
  });

  it('returns the first of multiple focusable elements', () => {
    const container = document.createElement('div');

    container.innerHTML = '<button>first</button><button>second</button><input type="text">';
    const [first] = container.querySelectorAll('button');

    expect(getFirstFocusableElement(container)).toStrictEqual(first);
  });

  it('returns the first non-disabled element when leading elements are all disabled', () => {
    const container = document.createElement('div');

    container.innerHTML = '<button disabled>one</button><button disabled>two</button><button>three</button>';
    const buttons = container.querySelectorAll('button');

    expect(getFirstFocusableElement(container)).toStrictEqual(buttons[2]);
  });
});
