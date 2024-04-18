class Collector {
  constructor(scope) {
    this.scope = scope
    this.intervals = []
    this.propertyNames = []
    this.timeouts = []
  }

  addInterval(interval) {
    if(!this.intervals.includes(interval)) {
      this.intervals.push(interval)
    }
  }

  addProperty(name) {
    if(!this.propertyNames.includes(name)) {
      this.propertyNames.push(name)
    }
  }

  addTimeout(timeout) {
    if(!this.timeouts.includes(timeout)) {
      this.timeouts.push(timeout)
    }
  }

  garbageAll() {
    // El orden es importante
    // Puede haber un interval/timeout que sea también una propiedad
    this.intervals.forEach( (interval) => {
      try {
        window.clearInterval(interval)
      } catch(e) {
        console.error(e)
      }
    })
    this.timeouts.forEach( (timeout) => {
      try {
        window.clearTimeout(timeout)
      } catch(e) {
        console.error(e)
      }
    })
    this.propertyNames.forEach( (name) => {
      try {
        this.scope[name] = null
      } catch(e) {
        console.error(e)
      }
    })
  }
}

export default Collector
