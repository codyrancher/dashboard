import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { useInterval } from './useInterval';

function createHarness(fn: () => void, delay: number) {
  return defineComponent({
    setup() {
      useInterval(fn, delay);
    },
    template: '<div />',
  });
}

describe('useInterval', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not call fn before the component is mounted', () => {
    const fn = jest.fn();

    createHarness(fn, 1000);

    expect(fn).not.toHaveBeenCalled();
  });

  it('calls fn after the specified delay once mounted', () => {
    const fn = jest.fn();

    mount(createHarness(fn, 1000));

    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls fn repeatedly on each interval tick', () => {
    const fn = jest.fn();

    mount(createHarness(fn, 500));

    jest.advanceTimersByTime(1500);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not call fn before the delay elapses', () => {
    const fn = jest.fn();

    mount(createHarness(fn, 200));

    jest.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('clears the interval on unmount so fn is not called afterwards', () => {
    const fn = jest.fn();
    const wrapper = mount(createHarness(fn, 1000));

    jest.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    jest.advanceTimersByTime(2000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('stops calling fn immediately when unmounted mid-interval', () => {
    const fn = jest.fn();
    const wrapper = mount(createHarness(fn, 1000));

    jest.advanceTimersByTime(500);
    wrapper.unmount();

    jest.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });

  it.each([
    {
      desc:  'short delay (100 ms) fires correct count',
      delay: 100,
      time:  350,
      calls: 3,
    },
    {
      desc:  'long delay (2000 ms) fires correct count',
      delay: 2000,
      time:  5000,
      calls: 2,
    },
  ])('$desc', ({ delay, time, calls }) => {
    const fn = jest.fn();

    mount(createHarness(fn, delay));
    jest.advanceTimersByTime(time);

    expect(fn).toHaveBeenCalledTimes(calls);
  });
});
