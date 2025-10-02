/**
 * Scheduler Service Module
 * Handles scheduling of various bot tasks
 */

class SchedulerService {
  constructor() {
    this.schedulers = new Map();
    this.lastMailingDate = null;
  }

  /**
   * Check if it's time to send mailing (Wednesday or Friday at 8 AM Kyiv time)
   * @returns {boolean}
   */
  isMailingTime() {
    const now = new Date();
    const kyivTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kiev" }));
    
    const dayOfWeek = kyivTime.getDay(); // 0 = Sunday, 3 = Wednesday, 5 = Friday
    const hour = kyivTime.getHours();
    const today = kyivTime.toDateString();
    
    // Only send if it's the right time AND we haven't sent today
    return (dayOfWeek === 3 || dayOfWeek === 5) && 
           hour === 8 && 
           this.lastMailingDate !== today;
  }

  /**
   * Mark mailing as sent for today
   */
  markMailingSent() {
    this.lastMailingDate = new Date().toDateString();
  }

  /**
   * Create a scheduler for a specific task
   * @param {string} name - Name of the scheduler
   * @param {Function} task - Function to execute
   * @param {number} interval - Interval in milliseconds
   * @param {Function} condition - Optional condition function to check before executing
   */
  createScheduler(name, task, interval, condition = null) {
    if (this.schedulers.has(name)) {
      console.log(`📅 Scheduler '${name}' already exists`);
      return;
    }

    console.log(`📅 Creating scheduler '${name}' with ${interval}ms interval`);
    
    const scheduler = setInterval(async () => {
      try {
        // Check condition if provided
        if (condition && !condition()) {
          return;
        }

        console.log(`📅 Executing scheduled task: ${name}`);
        await task();
      } catch (error) {
        console.error(`❌ Error in scheduler '${name}':`, error);
      }
    }, interval);

    this.schedulers.set(name, scheduler);
    console.log(`✅ Scheduler '${name}' created successfully`);
  }

  /**
   * Start a specific scheduler
   * @param {string} name - Name of the scheduler
   */
  startScheduler(name) {
    if (!this.schedulers.has(name)) {
      console.log(`❌ Scheduler '${name}' not found`);
      return;
    }
    console.log(`📅 Starting scheduler '${name}'`);
  }

  /**
   * Stop a specific scheduler
   * @param {string} name - Name of the scheduler
   */
  stopScheduler(name) {
    if (!this.schedulers.has(name)) {
      console.log(`❌ Scheduler '${name}' not found`);
      return;
    }

    clearInterval(this.schedulers.get(name));
    this.schedulers.delete(name);
    console.log(`📅 Scheduler '${name}' stopped`);
  }

  /**
   * Stop all schedulers
   */
  stopAllSchedulers() {
    console.log('📅 Stopping all schedulers...');
    
    for (const [name, scheduler] of this.schedulers) {
      clearInterval(scheduler);
      console.log(`📅 Stopped scheduler '${name}'`);
    }
    
    this.schedulers.clear();
    console.log('✅ All schedulers stopped');
  }

  /**
   * Get status of all schedulers
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      activeSchedulers: Array.from(this.schedulers.keys()),
      count: this.schedulers.size,
      lastMailingDate: this.lastMailingDate
    };
  }
}

export default new SchedulerService();
