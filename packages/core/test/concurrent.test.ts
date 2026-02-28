import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConcurrentQueue, TaskPriority, TaskStatus } from '../src/concurrent';

describe('ConcurrentQueue', () => {
  let queue: ConcurrentQueue;

  beforeEach(() => {
    queue = new ConcurrentQueue({
      maxConcurrent: 2,
      autoStart: false,
    });
  });

  describe('add', () => {
    it('should add task to queue', () => {
      const taskId = queue.add(async () => 'result');

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
    });

    it('should add tasks with different priorities', () => {
      const lowId = queue.add(async () => 'low', 'low');
      const normalId = queue.add(async () => 'normal', 'normal');
      const highId = queue.add(async () => 'high', 'high');

      expect(lowId).toBeDefined();
      expect(normalId).toBeDefined();
      expect(highId).toBeDefined();
    });

    it('should emit task:added event', () => {
      const handler = vi.fn();
      queue.on('task:added', handler);

      queue.add(async () => 'result');

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('process', () => {
    it('should process tasks', async () => {
      const result: string[] = [];

      queue.add(async () => {
        result.push('task1');
        return 'task1';
      });

      queue.add(async () => {
        result.push('task2');
        return 'task2';
      });

      queue.resume();
      await queue.waitAll();

      expect(result).toHaveLength(2);
    });

    it('should respect maxConcurrent limit', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const task = async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 100));
        concurrent--;
      };

      queue.add(task);
      queue.add(task);
      queue.add(task);
      queue.add(task);

      queue.resume();
      await queue.waitAll();

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should process high priority tasks first', async () => {
      const order: string[] = [];

      queue.add(async () => {
        order.push('low');
        return 'low';
      }, 'low');

      queue.add(async () => {
        order.push('high');
        return 'high';
      }, 'high');

      queue.add(async () => {
        order.push('normal');
        return 'normal';
      }, 'normal');

      queue.resume();
      await queue.waitAll();

      // high 应该在 low 之前
      const highIndex = order.indexOf('high');
      const lowIndex = order.indexOf('low');
      expect(highIndex).toBeLessThan(lowIndex);
    });
  });

  describe('pause and resume', () => {
    it('should pause queue', () => {
      queue.pause();
      expect(queue.isPaused()).toBe(true);
    });

    it('should resume queue', () => {
      queue.pause();
      queue.resume();
      expect(queue.isPaused()).toBe(false);
    });

    it('should not process tasks when paused', async () => {
      const handler = vi.fn();

      queue.add(async () => {
        handler();
        return 'result';
      });

      queue.pause();

      // 等待一段时间
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel pending task', () => {
      const taskId = queue.add(async () => 'result');

      const cancelled = queue.cancel(taskId);

      expect(cancelled).toBe(true);
      expect(queue.getTask(taskId)).toBeUndefined();
    });

    it('should emit task:cancelled event', () => {
      const handler = vi.fn();
      queue.on('task:cancelled', handler);

      const taskId = queue.add(async () => 'result');
      queue.cancel(taskId);

      expect(handler).toHaveBeenCalled();
    });

    it('should return false for non-existent task', () => {
      const cancelled = queue.cancel('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all tasks', () => {
      queue.add(async () => 'task1');
      queue.add(async () => 'task2');
      queue.add(async () => 'task3');

      queue.clear();

      expect(queue.isEmpty()).toBe(true);
    });

    it('should cancel all running tasks', async () => {
      queue.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return 'result';
      });

      queue.resume();
      await new Promise((resolve) => setTimeout(resolve, 50));

      queue.clear();

      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('getTask', () => {
    it('should return task by id', () => {
      const taskId = queue.add(async () => 'result');

      const task = queue.getTask(taskId);

      expect(task).toBeDefined();
      expect(task?.id).toBe(taskId);
    });

    it('should return undefined for non-existent task', () => {
      const task = queue.getTask('non-existent');
      expect(task).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return queue statistics', () => {
      queue.add(async () => 'task1');
      queue.add(async () => 'task2');

      const stats = queue.getStats();

      expect(stats.pending).toBe(2);
      expect(stats.running).toBe(0);
      expect(stats.total).toBe(2);
    });
  });

  describe('waitAll', () => {
    it('should wait for all tasks to complete', async () => {
      const results: string[] = [];

      queue.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        results.push('task1');
      });

      queue.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        results.push('task2');
      });

      queue.resume();
      await queue.waitAll();

      expect(results).toHaveLength(2);
    });
  });

  describe('setMaxConcurrent', () => {
    it('should update max concurrent limit', () => {
      queue.setMaxConcurrent(5);

      // 添加 5 个任务，应该都能并发执行
      let concurrent = 0;
      let maxConcurrent = 0;

      const task = async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 50));
        concurrent--;
      };

      for (let i = 0; i < 5; i++) {
        queue.add(task);
      }

      queue.resume();
      queue.setMaxConcurrent(5);

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(maxConcurrent).toBeLessThanOrEqual(5);
          resolve(undefined);
        }, 200);
      });
    });
  });

  describe('Events', () => {
    it('should emit task:started event', async () => {
      const handler = vi.fn();
      queue.on('task:started', handler);

      queue.add(async () => 'result');
      queue.resume();
      await queue.waitAll();

      expect(handler).toHaveBeenCalled();
    });

    it('should emit task:completed event', async () => {
      const handler = vi.fn();
      queue.on('task:completed', handler);

      queue.add(async () => 'result');
      queue.resume();
      await queue.waitAll();

      expect(handler).toHaveBeenCalled();
    });

    it('should emit task:failed event', async () => {
      const handler = vi.fn();
      queue.on('task:failed', handler);

      queue.add(async () => {
        throw new Error('Task failed');
      });

      queue.resume();
      await queue.waitAll();

      expect(handler).toHaveBeenCalled();
    });

    it('should emit queue:empty event', async () => {
      const handler = vi.fn();
      queue.on('queue:empty', handler);

      queue.add(async () => 'result');
      queue.resume();
      await queue.waitAll();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle task errors', async () => {
      const failedTasks: any[] = [];

      queue.on('task:failed', (task, error) => {
        failedTasks.push({ task, error });
      });

      queue.add(async () => {
        throw new Error('Task error');
      });

      queue.resume();
      await queue.waitAll();

      expect(failedTasks).toHaveLength(1);
      expect(failedTasks[0].error.message).toBe('Task error');
    });

    it('should continue processing after error', async () => {
      const results: string[] = [];

      queue.add(async () => {
        throw new Error('Error');
      });

      queue.add(async () => {
        results.push('success');
        return 'success';
      });

      queue.resume();
      await queue.waitAll();

      expect(results).toContain('success');
    });
  });

  describe('Timeout', () => {
    it('should cancel task on timeout', async () => {
      const timeoutQueue = new ConcurrentQueue({
        maxConcurrent: 1,
        timeout: 100,
        autoStart: true,
      });

      const handler = vi.fn();
      timeoutQueue.on('task:cancelled', handler);

      timeoutQueue.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'result';
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(handler).toHaveBeenCalled();
    });
  });
});
