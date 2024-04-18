import UAParser from 'ua-parser-js'
import { streamTypes } from '../types'

const {
  DASH,
  HLS,
  SMOOTH_STREAMING
} = streamTypes

export function getBrowserInfo() {
  if(typeof window !== 'undefined' && window.navigator) {
    const parser = new UAParser()
    parser.setUA(window.navigator.userAgent)

    return parser.getResult()
  } else {
    return null
  }
}

export function getIosVersion() {
  if(typeof window !== 'undefined' && window.navigator) {
    if (/iP(hone|od|ad)/.test(window.navigator.platform)) {
      // Supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
      const v = (window.navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/)

      return [
        parseInt(v[1], 10),
        parseInt(v[2], 10),
        parseInt(v[3] || 0, 10)
      ]
    }
  }
  return [0, 0, 0]
}

export function isAndroid() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return isMobileAny() && !isIos()
}

export function isAutoplayAllowed() {
  return (
    !isMobileAny() && !isSafari() && !isIE()
  )
}

export function isChrome() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return window.navigator.userAgent.toLowerCase().indexOf('chrome') !== -1
}

export function isEdge() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false

  const ua = window.navigator.userAgent

  const edge = ua.indexOf('Edge/')
  if (edge > 0) {
    // Edge (IE 12+) => return version number
    //return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10)
    return true
  }

  // other browser
  return false
}

export function isIncognito() {
  return new Promise((resolve, reject) => {
    if(!(typeof window !== 'undefined' && window.navigator)) resolve(false)

    // https://mishravikas.com/articles/2019-07/bypassing-anti-incognito-detection-google-chrome.html
    if('storage' in window.navigator && 'estimate' in window.navigator.storage) {
      window.navigator.storage.estimate()
      .then(({ usage, quota }) => {
        if(quota < 120000000) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
      .catch((error) => reject(error))
    } else {
      reject()
    }
  })
}

export function isStreamTypeSupported(type, withDrm) {
  if(type === SMOOTH_STREAMING) return false
  if(type === DASH && isSafari()) return false
  if(withDrm) {
    if(isSafari()) {
      if(type !== HLS) return false
    } else {
      if(type !== DASH) return false
    }
  } else {
    if(type === DASH) return false
  }
  return true
}

export function isFullScreenSupported(mediaElement) {
  if(typeof window !== 'undefined' && document) {
    if (document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled || (mediaElement && mediaElement.webkitSupportsFullscreen)) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

/*
 * Modernizr: https://gist.github.com/4rn0/4174742
 */
export function isHlsSupported() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false

  const a = window.navigator.userAgent

  if (a.match(/iPod/) || isSafari()) {
    return true
  }

  return false
}

export function isHtml5AudioSupported() {
  if(typeof window !== 'undefined' && document && document.createElement) {
    const canPlayType = document.createElement('video').canPlayType('audio/mp3')
    return (canPlayType === 'probably' || canPlayType === 'maybe')
  } else {
    return false
  }
}

/*
 * https://codepen.io/gapcode/pen/vEJNZN
 */
export function isIE() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false

  const ua = window.navigator.userAgent

  // Test values; Uncomment to check result …

  // IE 10
  // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)'

  // IE 11
  // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'

  // Edge 12 (Spartan)
  // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0'

  // Edge 13
  // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586'

  const msie = ua.indexOf('MSIE ')
  if (msie > 0) {
    // IE 10 or older => return version number
    //return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10)
    return true
  }

  const trident = ua.indexOf('Trident/')
  if (trident > 0) {
    // IE 11 => return version number
    //const rv = ua.indexOf('rv:');
    //return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10)
    return true
  }

  // const edge = ua.indexOf('Edge/')
  // if (edge > 0) {
  //   // Edge (IE 12+) => return version number
  //   //return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10)
  //   return true
  // }

  // other browser
  return false
}

export function isInstagramMobile() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return /instagram/i.test(window.navigator.userAgent) && isMobilePhone()
}

export function isFacebookMobile() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return /facebook|fba/i.test(window.navigator.userAgent) && isMobilePhone()
}

export function isHuaweiTablet() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return /CMR-AL09/i.test(window.navigator.userAgent)
}

export function isIos() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent) || isSafari13OnIPad()
}

export function isIPhone() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return /iPhone/i.test(window.navigator.userAgent)
}

export function isIPhonePlaysInline() {
  return getIosVersion()[0] >= 10
}

export function isIPad(strict) {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  if(strict) {
    return /iPad/i.test(window.navigator.userAgent)
  } else {
    return /iPad/i.test(window.navigator.userAgent) || isSafari13OnIPad()
  }
}

export function isMobileAny() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return isMobilePhone() || isTablet()
}

export function isMobilePhone() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  const ua = new UAParser(window.navigator.userAgent)
  return /mobile/i.test(ua.getDevice().type)
}

export function isPreloadAllowed() {
  return !isIos() || getIosVersion()[0] > 10
}

export function isSafari() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent)
}

export function isSafari13OnIPad() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false

  const ua = new UAParser(window.navigator.userAgent)
  const browser = ua.getBrowser()

  if(/safari/i.test(browser.name) && parseInt(browser.version) >= 13 && !isMobilePhone()) {
    return window.navigator.maxTouchPoints > 1
  }
  return false
}

export function isSamsungBrowser() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  return /SamsungBrowser/i.test(window.navigator.userAgent)
}

export function isTablet() {
  if(!(typeof window !== 'undefined' && window.navigator)) return false
  const ua = new UAParser(window.navigator.userAgent)
  return /tablet/i.test(ua.getDevice().type) || isSafari13OnIPad() || isHuaweiTablet()
}

export function isUbuntu() {
  if(typeof window !== 'undefined' && window.navigator) {
    const parser = new UAParser()
    if(parser) {
      const os = parser.getOS()
      return (os && os.name && os.name.toLowerCase() === 'linux')
    }
  }
  return false
}

export function mustUseHlsJs(isLive) {
  return (
    !isHlsSupported() || ( isMobilePhone() && !isIos() && !isSamsungBrowser() )
  )
}

export function mustUseStarterSrc() {
  return !isAutoplayAllowed()
}

export function isPortrait() {
  if (typeof window === 'undefined') return false
  return window.innerHeight > window.innerWidth
}
