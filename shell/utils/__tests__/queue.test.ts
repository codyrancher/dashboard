import Queue from '@shell/utils/queue';

describe('queue', () => {
  describe('initial state', () => {
    it('starts with length 0', () => {
      const q = new Queue();

      expect(q.getLength()).toStrictEqual(0);
    });

    it('starts empty', () => {
      const q = new Queue();

      expect(q.isEmpty()).toStrictEqual(true);
    });

    it('peek on empty queue returns undefined', () => {
      const q = new Queue();

      expect(q.peek()).toStrictEqual(undefined);
    });

    it('dequeue on empty queue returns undefined', () => {
      const q = new Queue();

      expect(q.dequeue()).toStrictEqual(undefined);
    });
  });

  describe('enqueue', () => {
    it('increases length after each enqueue', () => {
      const q = new Queue();

      q.enqueue('a');
      expect(q.getLength()).toStrictEqual(1);

      q.enqueue('b');
      expect(q.getLength()).toStrictEqual(2);

      q.enqueue('c');
      expect(q.getLength()).toStrictEqual(3);
    });

    it('is not empty after enqueue', () => {
      const q = new Queue();

      q.enqueue('x');

      expect(q.isEmpty()).toStrictEqual(false);
    });
  });

  describe('dequeue', () => {
    it('returns items in FIFO order', () => {
      const q = new Queue();

      q.enqueue('first');
      q.enqueue('second');
      q.enqueue('third');

      expect(q.dequeue()).toStrictEqual('first');
      expect(q.dequeue()).toStrictEqual('second');
      expect(q.dequeue()).toStrictEqual('third');
    });

    it('decreases length after each dequeue', () => {
      const q = new Queue();

      q.enqueue('a');
      q.enqueue('b');
      q.dequeue();

      expect(q.getLength()).toStrictEqual(1);
    });

    it('is empty after dequeuing all items', () => {
      const q = new Queue();

      q.enqueue('a');
      q.dequeue();

      expect(q.isEmpty()).toStrictEqual(true);
      expect(q.getLength()).toStrictEqual(0);
    });

    it('returns undefined when queue becomes empty during sequential dequeue', () => {
      const q = new Queue();

      q.enqueue('only');
      q.dequeue();

      expect(q.dequeue()).toStrictEqual(undefined);
    });
  });

  describe('peek', () => {
    it('returns front item without removing it', () => {
      const q = new Queue();

      q.enqueue('front');
      q.enqueue('back');

      expect(q.peek()).toStrictEqual('front');
      expect(q.getLength()).toStrictEqual(2);
    });

    it('returns undefined after all items are dequeued', () => {
      const q = new Queue();

      q.enqueue('a');
      q.dequeue();

      expect(q.peek()).toStrictEqual(undefined);
    });

    it('reflects new front item after dequeue', () => {
      const q = new Queue();

      q.enqueue('first');
      q.enqueue('second');
      q.dequeue();

      expect(q.peek()).toStrictEqual('second');
    });
  });

  describe('memory reclamation', () => {
    it('correctly reports length and order after internal array is reclaimed', () => {
      const q = new Queue();

      // Enqueue 4 items; dequeue 2 triggers reclamation (offset*2 >= queue.length)
      q.enqueue('a');
      q.enqueue('b');
      q.enqueue('c');
      q.enqueue('d');

      q.dequeue(); // offset=1; 1*2=2 < 4 → no reclaim
      q.dequeue(); // offset=2; 2*2=4 >= 4 → reclaim: queue=[c,d], offset=0

      expect(q.getLength()).toStrictEqual(2);
      expect(q.dequeue()).toStrictEqual('c');
      expect(q.dequeue()).toStrictEqual('d');
      expect(q.isEmpty()).toStrictEqual(true);
    });

    it('remains consistent across multiple reclamation cycles', () => {
      const q = new Queue();

      for (let i = 0; i < 8; i++) {
        q.enqueue(i);
      }

      const results: number[] = [];

      while (!q.isEmpty()) {
        results.push(q.dequeue() as number);
      }

      expect(results).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe('clear', () => {
    it('resets length to 0', () => {
      const q = new Queue();

      q.enqueue('a');
      q.enqueue('b');
      q.clear();

      expect(q.getLength()).toStrictEqual(0);
    });

    it('makes queue empty after clear', () => {
      const q = new Queue();

      q.enqueue('a');
      q.clear();

      expect(q.isEmpty()).toStrictEqual(true);
    });

    it('allows enqueue after clear', () => {
      const q = new Queue();

      q.enqueue('old');
      q.clear();
      q.enqueue('new');

      expect(q.getLength()).toStrictEqual(1);
      expect(q.dequeue()).toStrictEqual('new');
    });
  });

  describe('mixed items', () => {
    it.each([
      {
        desc:     'numeric values',
        items:    [1, 2, 3],
        expected: [1, 2, 3],
      },
      {
        desc:     'object values',
        items:    [{ id: 1 }, { id: 2 }],
        expected: [{ id: 1 }, { id: 2 }],
      },
      {
        desc:     'null and undefined values',
        items:    [null, undefined, 'after-null'],
        expected: [null, undefined, 'after-null'],
      },
      {
        desc:     'boolean values',
        items:    [true, false, true],
        expected: [true, false, true],
      },
    ])('preserves FIFO order for $desc', ({ items, expected }) => {
      const q = new Queue();

      items.forEach((item) => q.enqueue(item));

      const results: unknown[] = [];

      while (!q.isEmpty()) {
        results.push(q.dequeue());
      }

      expect(results).toStrictEqual(expected);
    });
  });
});
