export default class EventDispatcher {
  constructor() {
    this.eventListeners = {}
  }

  addEventListener(eventType, callback) {
    const id = `${Date.now()}_${Math.round(Math.random() * 1000000)}`

    callback.idEventDispatcher = id

    if(!this.eventListeners[eventType]) this.eventListeners[eventType] = []
    this.eventListeners[eventType].push(callback)
  }

  hasEventListener(eventType, callback) {
    if(this.eventListeners && this.eventListeners[eventType]) {
      return this.eventListeners[event.type].some( (listener) => {
        listener.idEventDispatcher === callback.idEventDispatcher
      })
    }
    return false
  }

  removeEventListener(eventType, callback) {
    if(this.eventListeners && this.eventListeners[eventType]) {
      this.eventListeners[eventType] = this.eventListeners[eventType].map( (listener) => listener.idEventDispatcher !== callback.idEventDispatcher ? listener : null )

      if(this.eventListeners[eventType].length === 0) {
        this.eventListeners[eventType] = undefined
      }
    }
  }

  removeAllEventListeners() {
    if(this.eventListeners) {
      for(let eventType in this.eventListeners) {
        this.eventListeners[eventType] = []
      }
      this.eventListeners = null
    }
  }

  dispatchEvent(event) {
    if(event){
      if(typeof event === 'string') {
        event = { type: event }
      }
      if(event.type) {
        if(this.eventListeners && this.eventListeners[event.type]) {
          this.eventListeners[event.type].forEach( (listener) => {
            listener(event)
          })
        }
      }
    }
  }
}
