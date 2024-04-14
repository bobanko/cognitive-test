export class Timer {
  interval = null;
  timeStart = null;

  constructor() {
    //
  }

  handlers = [];

  onUpdate(handler) {
    this.handlers.push(handler);
  }

  removeOnUpdate(handler) {
    // todo(vmyshko): impl
  }

  _timerInterval() {
    const diff = this.getDiff();

    this.handlers.forEach((handler) => {
      handler(diff);
    });
  }

  start() {
    clearInterval(this.interval);
    this.timeStart = new Date().getTime();

    this.interval = setInterval(() => this._timerInterval(), 1000);
    this._timerInterval(); //first intstant run
  }

  stop() {
    this._timerInterval(); //last intstant run
    clearInterval(this.interval);
  }

  getDiff() {
    const timeNow = new Date().getTime();
    const diff = timeNow - this.timeStart;
    return diff;
  }
}
