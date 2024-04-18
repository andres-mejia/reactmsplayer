class EventHandler {

  constructor() {
    this._listeners = new Map()
    this._persistent_events = new Map()
  }

  addListener(listener, action) {
    let actionArray = []

    if (typeof this._listeners.get(listener) !== 'undefined') {
      actionArray = this._getListener(listener)
    }

    actionArray.push(action)
    this._listeners.set(listener, actionArray)
    this._checkPersistentEvent(listener, action)
  }

  getAllListeners() {
    return this._listeners
  }

  removeListener(listener) {
    this._listeners.delete(listener)
  }
  
  _getListener(listener) {
    return this._listeners.get(listener)
  }

  dispatchEvent(event, ...args) {
    const eventActions = this._getListener(event)
    if (typeof eventActions !== 'undefined') {
      eventActions.map((actionFired) => { actionFired(...args) })
    }
  }
  
  dispatchPersistentEvent(event, ...args) {
    this.dispatchEvent(event, ...args)
    
    let dispatchedArray = []
    if (typeof this._persistent_events.get(event) !== 'undefined') {
      dispatchedArray = this._persistent_events.get(event)
    }
    dispatchedArray.push(...args)
    this._persistent_events.set(event, dispatchedArray)
  }
  
  _checkPersistentEvent(listener, actionFired) {
    const eventArgsArr = this._persistent_events.get(listener)
    if (typeof eventArgsArr !== 'undefined') {
      eventArgsArr.map((...args) => { actionFired(...args) })
    }
  }
}

export default EventHandler
