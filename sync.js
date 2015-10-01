"use strict";

var sleep = require('sleep')


class Sync {
  /**
   * Run an async routine and return when one of the following criteria is met
   *   - a certain condition is true
   *   - the async routine completes
   *   - timeout occurs
   *
   *
   * @param context
   * @param asyncRoutine
   * @param args
   * @param criteria An object describing completion criteria in the form
   *
   *        {
   *          'timeout': <integer>,
   *          'condition': <function returns true/false>,
   *          'callback': <true/false> (indicates whether or not to wait fo
   *        }
   */

  constructor(context, asyncRoutine, args, criteria) {
    this.ctx = context
    this.asyncRoutine = asyncRoutine
    this.args = args

    // Defaults
    this.criteria = {
      timeout: 10,
      condition: null,
      callback: false
    }

    // Override criteria if needed
    if (criteria.timeout) {
      this.criteria.timeout = criteria.timeout
    }
    if (criteria.condition) {
      this.criteria.condition = criteria.condition
    }
    if (criteria.callback) {
      this.criteria.callback = criteria.callbacks
    }

    // Internal state
    this.done = false
    this.retval = null
    this.startTimeSeconds = null

    // Add our own callback as the last arg
    this.args.push(this._callback)

  }

  _callback(retval) {
      this.retval = retval
      this.done = true
  }

  _monitorCriteria() {
    /* Block until one of the criteria is met */

    while (true) {

      // Check for timeout condition, this trumps all other conditions
      var nowSeconds = new Date().getTime() / 1000
      if (nowSeconds > this.startTimeSeconds + this.criteria.timeout) {
        throw 'Timeout'
      }

      if (this.criteria.callback) {
        if (this.done) {
          return this.retval
        }
      }

      if (this.criteria.condition != null) {
        if (this.criteria.condition()) {
          return true
        }
      }

      sleep.usleep(500)  // half a second
    }
  }

  complete() {
    this.startTimeSeconds = new Date().getTime() / 1000
    if (this.ctx != null) {
      this.asyncRoutine.apply(this.ctx, this.args)
    } else {
      this.asyncRoutine.apply(this.args)
    }
    return this._monitorCriteria()
  }
}

module.exports = Sync
