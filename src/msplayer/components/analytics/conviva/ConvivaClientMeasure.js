// Implements Conviva.ClientMeasureInterface

export default function ConvivaClientMeasure() {

  function _constr(player) {
    this.player = player
  }

   _constr.apply(this, arguments)

  // Latest buffer length collected, in milliseconds. -1 if not available.
  this.getBufferLength = function() {
    return -1
  }

  // Latest play head time collected, in milliseconds. -1 if not available.
  this.getPHT = function() {
    return this.player && !isNaN(this.player.currentTime) ? Math.round(this.player.currentTime * 1000) : -1
  }

  // Latest rendered frame rate collected. -1 if not available.
  this.getRenderedFrameRate = function() {
    return -1
  }

  // Latest signal strength collected, in db. 1000 if not available.
  this.getSignalStrength = function() {
    return 1000
  }

  this.release = function() {
    // nothing to release
  }
}
