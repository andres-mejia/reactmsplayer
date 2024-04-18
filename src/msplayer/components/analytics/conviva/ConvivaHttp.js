import fetch from 'isomorphic-fetch'

// Implements Conviva.HttpInterface

export default function ConvivaHttp() {

  function _constr() {
    // nothing to initialize
  }

   _constr.apply(this, arguments)

  this.makeRequest = function (httpMethod, url, data, contentType, timeoutMs, callback) {
    let init = {
      method: httpMethod
    }
    if(data) init.body = data
    if(contentType) init.headers = {
      'Content-Type': contentType
    }

    // https://developers.google.com/web/updates/2017/09/abortable-fetch
    if(timeoutMs > 0 && typeof window !== 'undefined') {
      if(typeof window.AbortController !== 'undefined') {
        const controller = new window.AbortController()
        const signal = controller.signal

        window.setTimeout(() => controller.abort(), timeoutMs)

        init.signal = signal
      }
    }

  	fetch(url, init)
    .then((response) => {
      if (response.ok) {
        return response.text()
      } else {
        if(callback) callback(false, response.statusText)
      }
    })
    .then((text) => {
      if(callback) callback(true, text)
    })
    .catch((error) => {
      if(callback) callback(false, error.message)
    })
  }

  this.release = function() {
    // nothing to release
  }
}
