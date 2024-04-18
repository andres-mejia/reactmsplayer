// Implements Conviva.TimeInterface

export default function ConvivaTime() {

  function _constr() {
    // nothing to initialize
  }

  _constr.apply(this, arguments)

  this.getEpochTimeMs = function () {
    const d = new Date()
    return d.getTime()
  }

  this.release = function() {
    // nothing to release
  }
}
