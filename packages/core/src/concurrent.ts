import EventEmitter from 'events';

/**
 * 任务优先级
 */
export type TaskPriority = 'high' | 'normal' | 'low';

/**
 * 任务状态
 */
export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * 任务接口
 */
export interface Task<T = any> {
  /** 任务 ID */
  id: string;

  /** 任务优先级 */
  priority: TaskPriority;

  /** 任务状态 */
  status: TaskStatus;

  /** 任务函数（支持 AbortSignal） */
  run: (signal?: AbortSignal) => Promise<T>;

  /** 任务结果 */
  result?: T;

  /** 任务错误 */
  error?: Error;

  /** 创建时间 */
  createdAt: number;

  /** 开始时间 */
  startedAt?: number;

  /** 完成时间 */
  completedAt?: number;

  /** 进度 */
  progress?: number;

  /** 取消控制器 */
  abortController?: AbortController;
}

/**
 * 队列配置
 */
export interface QueueOptions {
  /** 最大并发数 */
  maxConcurrent?: number;

  /** 是否自动开始 */
  autoStart?: boolean;

  /** 任务超时时间（毫秒） */
  timeout?: number;
}

/**
 * 并发队列
 * 管理多个 FFmpeg 任务的并发执行
 */
export class ConcurrentQueue extends EventEmitter {
  private maxConcurrent: number;
  private autoStart: boolean;
  private timeout: number;
  private queue: Task[] = [];
  private running: Map<string, Task> = new Map();
  private completedTasks: Task[] = [];
  private maxHistorySize = 100;
  private paused = false;
  private taskIdCounter = 0;

  constructor(options: QueueOptions = {}) {
    super();
    this.maxConcurrent = options.maxConcurrent || 3;
    this.autoStart = options.autoStart !== false;
    this.timeout = options.timeout || 0;
  }

  /**
   * 添加任务
   */
  add<T>(run: (signal?: AbortSignal) => Promise<T>, priority: TaskPriority = 'normal'): string {
    const abortController = new AbortController();

    const task: Task<T> = {
      id: this.generateTaskId(),
      priority,
      status: 'pending',
      run: () => run(abortController.signal),
      abortController,
      createdAt: Date.now(),
    };

    // 根据优先级插入队列
    this.insertTask(task);

    this.emit('task:added', task);

    // 自动开始处理
    if (this.autoStart && !this.paused) {
      this.process();
    }

    return task.id;
  }

  /**
   * 根据优先级插入任务
   */
  private insertTask(task: Task): void {
    const priorityOrder: Record<TaskPriority, number> = {
      high: 0,
      normal: 1,
      low: 2,
    };

    const taskPriority = priorityOrder[task.priority];

    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const currentPriority = priorityOrder[this.queue[i]?.priority ?? 'normal'];
      if (taskPriority < currentPriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, task);
  }

  /**
   * 处理队列
   */
  private async process(): Promise<void> {
    if (this.paused) {
      return;
    }

    // 检查是否达到最大并发数
    if (this.running.size >= this.maxConcurrent) {
      return;
    }

    // 从队列中取出任务
    const task = this.queue.shift();
    if (!task) {
      // 队列为空
      if (this.running.size === 0) {
        this.emit('queue:empty');
      }
      return;
    }

    // 标记任务为运行中
    task.status = 'running';
    task.startedAt = Date.now();
    this.running.set(task.id, task);

    this.emit('task:started', task);

    // 执行任务
    let timeoutId: NodeJS.Timeout | null = null;
    let cancelled = false;

    if (this.timeout > 0) {
      timeoutId = setTimeout(() => {
        cancelled = true;
        try {
          this.cancel(task.id);
        } catch (error: any) {
          console.error(`Failed to cancel task ${task.id}: ${error.message}`);
        }
      }, this.timeout);
    }

    try {
      const result = await task.run();

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!cancelled) {
        // 任务完成
        task.result = result;
        task.status = 'completed';
        task.completedAt = Date.now();

        // 添加到历史记录
        this.addToHistory(task);

        this.emit('task:completed', task);
      }
    } catch (error: any) {
      // 任务失败
      task.error = error;
      task.status = 'failed';
      task.completedAt = Date.now();

      // 添加到历史记录
      this.addToHistory(task);

      this.emit('task:failed', task, error);
    } finally {
      // 从运行中移除
      this.running.delete(task.id);

      // 继续处理下一个任务
      this.process();
    }
  }

  /**
   * 添加到历史记录
   * @private
   */
  private addToHistory(task: Task): void {
    this.completedTasks.push(task);

    // 限制历史记录大小
    if (this.completedTasks.length > this.maxHistorySize) {
      this.completedTasks.shift();
    }
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `task-${++this.taskIdCounter}-${Date.now()}`;
  }

  /**
   * 暂停队列
   */
  pause(): void {
    this.paused = true;
    this.emit('queue:paused');
  }

  /**
   * 恢复队列
   */
  resume(): void {
    this.paused = false;
    this.emit('queue:resumed');
    this.process();
  }

  /**
   * 取消任务
   */
  cancel(taskId: string): boolean {
    // 从队列中移除
    const queueIndex = this.queue.findIndex((t) => t.id === taskId);
    if (queueIndex !== -1) {
      const task = this.queue.splice(queueIndex, 1)[0];
      if (task) {
        task.status = 'cancelled';
        this.emit('task:cancelled', task);
      }
      return true;
    }

    // 从运行中移除（如果正在运行）
    const runningTask = this.running.get(taskId);
    if (runningTask) {
      // 触发 AbortSignal
      if (runningTask.abortController) {
        runningTask.abortController.abort();
      }

      runningTask.status = 'cancelled';
      this.running.delete(taskId);
      this.emit('task:cancelled', runningTask);
      return true;
    }

    return false;
  }

  /**
   * 清空队列
   */
  clear(): void {
    // 取消所有待处理任务
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        task.status = 'cancelled';
        this.emit('task:cancelled', task);
      }
    }

    // 取消所有运行中任务
    this.running.forEach((task) => {
      task.status = 'cancelled';
      this.emit('task:cancelled', task);
    });
    this.running.clear();

    this.emit('queue:cleared');
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): Task | undefined {
    // 从队列中查找
    const queuedTask = this.queue.find((t) => t.id === taskId);
    if (queuedTask) {
      return queuedTask;
    }

    // 从运行中查找
    return this.running.get(taskId);
  }

  /**
   * 获取队列统计信息
   */
  getStats(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const completed = this.completedTasks.filter(t => t.status === 'completed').length;
    const failed = this.completedTasks.filter(t => t.status === 'failed').length;

    return {
      pending: this.queue.length,
      running: this.running.size,
      completed,
      failed,
      total: this.queue.length + this.running.size + this.completedTasks.length,
    };
  }

  /**
   * 等待所有任务完成
   */
  async waitAll(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.queue.length === 0 && this.running.size === 0) {
          resolve();
        } else {
          this.once('queue:empty', resolve);
        }
      };

      check();
    });
  }

  /**
   * 设置最大并发数
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
    // 如果增加了并发数，尝试处理更多任务
    this.process();
  }

  /**
   * 是否暂停中
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * 是否为空
   */
  isEmpty(): boolean {
    return this.queue.length === 0 && this.running.size === 0;
  }
}
