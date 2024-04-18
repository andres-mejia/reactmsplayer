// Implements Conviva.LoggingInterface

export default function ConvivaLogging() {

  function _constr () {
    // nothing to initialize
  }

  _constr.apply(this, arguments)

  this.consoleLog = function (message, logLevel) {
    if(typeof window !== 'undefined' && typeof window.Conviva !== 'undefined') {
      if (typeof window.console === 'undefined') return

      if (console.log && logLevel === window.Conviva.SystemSettings.LogLevel.DEBUG ||
        logLevel === window.Conviva.SystemSettings.LogLevel.INFO) {
        console.log(message)
      } else if (console.warn && logLevel === window.Conviva.SystemSettings.LogLevel.WARNING) {
        console.warn(message)
      } else if (console.error && logLevel === window.Conviva.SystemSettings.LogLevel.ERROR) {
        console.error(message)
      }
    }
  }

  this.release = function () {
    // nothing to release
  }
}
