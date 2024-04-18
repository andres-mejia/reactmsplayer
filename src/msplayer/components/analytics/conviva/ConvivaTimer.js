// Implements Conviva.TimerInterface

// setInterval does exactly what we need. We just need to return a function
// which cancels the timer when called.
// Some JavaScript implementations do not have setInterval, in which case
// you may have to write it yourself using setTimeout.

export default function ConvivaTimer() {

  function _constr() {
     // nothing to initialize
  }

  _constr.apply(this, arguments)

  this.createTimer = function (timerAction, intervalMs, actionName) {
    let timerId = setInterval(timerAction, intervalMs)
    const cancelTimerFunc = (() => {
      if (timerId !== -1) {
        clearInterval(timerId)
        timerId = -1
      }
    })
    return cancelTimerFunc
  }

  this.release = function() {
    // nothing to release
  }
}
