import { isObject } from './types'

export class Logger {
  constructor() {
    this.id = `logger_${Math.round(Math.random() * 1000000)}`
    this.history = []
    this.startTimes = {}
    this.initPerformance()

    this.subscribers = null

    this.end = this.end.bind(this)
    this.getLog = this.getLog.bind(this)
    this.log = this.log.bind(this)
    this.reset = this.reset.bind(this)
    this.start = this.start.bind(this)
    this.subscribe = this.subscribe.bind(this)
    this.unsubscribe = this.unsubscribe.bind(this)
  }

  reset() {
    this.history = []
    if(this.startTimes) {
      for(let id in this.startTimes) {
        delete this.startTimes[id]
      }
    }
    this.startTimes = {}
    this.initPerformance()
  }

  initPerformance() {
    if(typeof window === 'undefined') return
    this.performance = typeof window.performance !== 'undefined' ? window.performance : Date
  }

  subscribe(callback, id) {
    id = id || Math.round(Math.random() * 1000000)

    if(!this.subscribers) this.subscribers = {}
    this.subscribers[id] = callback
  }

  unsubscribe(id) {
    if(this.subscribers){
      delete this.subscribers[id]
    }
  }

  log(message, params, level = 'info', ...tags) {
    if(typeof document === 'undefined') return null

    if(message) {
      tags = tags.length ? tags : ['player']

      const time = `[${new Date().toISOString()}]`
      let output = `${time}[${level.toUpperCase()}]`
      output += `[${tags.map((tag) => tag.toUpperCase()).join('/')}]`
      // if(module) output += `[${module.toUpperCase()}]`
      // if(submodule) output += `[${submodule.toUpperCase()}]`
      output += ` ${message}`
      try {
        if(params) {
          if(isObject(params)) {
            if(Object.keys(params).length > 0) {
              output += ` <[CDATA[${JSON.stringify(params)}]]>`
            }
          } else if(Array.isArray(params)) {
            if(params.length > 0) {
              output += ` <[CDATA[${JSON.stringify(params)}]]>`
            }
          } else {
            output += ` <[CDATA[${JSON.stringify(params)}]]>`
          }
        }
      } catch(e) {
        console.error(e)
      }

      if(!this.history) this.history = []
      this.history.push(output)

      if(typeof window !== 'undefined') {
        if(window.MSPlayer && window.MSPlayer.logEnabled === false) return

        switch(level.toLowerCase()) {
          case 'error':
            console.error(output)
            break
          case 'warn':
            console.warn(output)
            break
          case 'info':
          default:
            console.info(output)
            break
        }
      }

      if(this.subscribers) {
        for(let id in this.subscribers) {
          this.subscribers[id](output)
        }
      }
    }
  }

  info(message, params, ...tags) {
    this.log(message, params, 'info', ...tags)
  }

  warn(message, params, ...tags) {
    this.log(message, params, 'warn', ...tags)
  }

  error(message, params, ...tags) { 
    this.log(message, params, 'error', ...tags)
  }

  factory(...tags) {
    return {
      error: (message, params, ...moreTags) => this.log(message, params, 'error', ...tags, ...moreTags),
      factory: this.factory,
      getLog: this.getLog,
      info: (message, params, ...moreTags) => this.log(message, params, 'info', ...tags, ...moreTags),
      log: this.log,
      warn: (message, params, ...moreTags) => this.log(message, params, 'warn', ...tags, ...moreTags)
    }
  }

  start(id, message) {
    if(typeof window === 'undefined') return
    if(!this.performance) this.initPerformance()

    this.startTimes[id] = this.performance.now()
    if(message) this.info(message)
  }

  end(id, message) {
    if(typeof window === 'undefined') return
    if(!this.performance) this.initPerformance()

    if(isNaN(this.startTimes[id]) || this.startTimes[id] === Infinity || this.startTimes[id] < 0) {
      this.warn(`No se ha podido calcular la duración del proceso "${id}" porque el tiempo de inicio es: ${this.startTimes[id]}.`)
      return
    }

    const delay = this.performance.now() - this.startTimes[id]

    message = message || `El proceso "${id}" ha tardado ${delay} ms.`
    this.info(message)
  }

  getLog(logLevels, contexts) {
    if(this.history && this.history.length) {
      if(logLevels || contexts) {
        let logLevelsRegExpStr = ''
        let contextsRegExpStr = ''
        if(logLevels) {
          if(!Array.isArray(logLevels)) logLevels = [logLevels]
          logLevelsRegExpStr = `\\[(${logLevels.map((id) => `${id}`).join('|')})\\]`
        }
        if(contexts) {
          if(!Array.isArray(contexts)) contexts = [contexts]
          contextsRegExpStr = `\\[(${contexts.map((id) => `${id}`).join('|')})\\]`
        }

        return this.history.filter((message) => {
          const regExp = new RegExp(`${logLevelsRegExpStr}${contextsRegExpStr}`, 'i')
          return !!(message && typeof message === 'string' && regExp.test(message))
        }).join('\n')

      } else {
        return [ ...this.history ].join('\n')
      }
    } else {
      return ''
    }
  }
}
