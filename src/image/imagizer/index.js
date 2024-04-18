import { isEmpty } from '../../msplayer/commons/util'
import imageConfig from './config.json'

// Regular expressions
//const regExpUrlIsAbsolute = new RegExp(/^https?:\/\//)

// NOTE: http://www.ietf.org/rfc/rfc3986.txt
//const regExpBreakDownUrl = new RegExp(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/)

/**
 * Creates a size object for imagizer url and builds imagizer url
 * @param  {String} url
 * @param  {Object} imagizer
 * @return {String}
 */
const getCustomSizeImagizerUrl = (url, imagizer) => {
  const size = {}

  if(imagizer.width) {
    size.width = imagizer.width
  }

  if(imagizer.height) {
    size.height = imagizer.height
  }

  return addParamsToImagizerUrl(url, size)
}

/**
 * Adds imagizer parameters to utl
 * @param {String} url
 * @param {Object} params
 */
const addParamsToImagizerUrl = (url, params) => {
  let imagizerUrl = url // NOTE: Functional programming buddy

  if(isEmpty(params)) {
    return imagizerUrl
  }

  let separator = (imagizerUrl.indexOf('?') === -1) ? '?' : '&'
  for(let key in params) {
    if(params[key]){
      imagizerUrl += `${separator}${key}=${params[key]}`
      if(separator === '?'){
        separator = '&'
      }
    }
  }

  return imagizerUrl
}

const getImagizerDefaultUrl = (url) => `${ url }?w=${ imageConfig.defaultWidth }`

/**
 * Builds srcSet with the provided sizes.
 * @param  {String} src
 * @param  {Array} srcs
 * @return {Object}
 */
const getSrcSet = (url) => {
  let srcSet = []
  const { srcs } = imageConfig
  const separator = (url.indexOf('?') === -1) ? '?' : '&'
  for(let i in srcs){
    srcSet.push(`${ url }${ separator }w=${ srcs[i].iw } ${ srcs[i].w }`)
  }
  return srcSet.join(', ')
}

const getSizes = (type) => {
  const { types, defaultSizes, sizes } = imageConfig
  let typeSizes = defaultSizes
  if(types[type] && sizes[types[type]]){
    typeSizes = sizes[types[type]]
  }
  return typeSizes
}

/**
 * If browser, retrieves browser viewport width and build imagizer url with chosen size.
 * If server (or default) chose mobile size
 * @param  {String} url
 * @param  {Object} sizes
 * @return {String}
 */
const getFallbackUrl = (url) => {
  const { srcs } = imageConfig
  const w = Math.max(window.document.documentElement.clientWidth, window.innerWidth || 0)
  const separator = (url.indexOf('?') === -1) ? '?' : '&'

  let selectedW = srcs[0].iw
  for(let i = 1; i < srcs.length; i++){
    if(srcs[i].iw > w){
      selectedW = srcs[i].iw
    }
  }
  return `${ url }${ separator }w=${ selectedW }`
}


export { getCustomSizeImagizerUrl, addParamsToImagizerUrl, getImagizerDefaultUrl, getSrcSet, getSizes, getFallbackUrl }
