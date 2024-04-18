export function concatSuffix(url, suffix) {
  if(!url || !suffix) return url

  const separator = url.indexOf('?') !== -1 ? '&' : '?'

  return `${url}${separator}${suffix}`
}

export function createLocalUrl(obj) {
  if(typeof window === 'undefined') return null
  if(!obj) return null

  let url = null

  try {
    const objStr = JSON.stringify(obj)
    const blob = new Blob([objStr], { type: 'application/json' })

    url = URL.createObjectURL(blob) 
  } catch(e) {
    console.error(e)
    return null
  }
  return url
}

export function getExtension(url) {
  if (url) {
    if (url.indexOf('?') !== -1) {
      url = url.substr(0, url.indexOf('?'))
    }
    return url.substr(url.lastIndexOf('.') + 1).toLowerCase()
  } else {
    return ''
  }
}

export function isDash(url) {
  let extension = getExtension(url)
  if(extension) {
    extension = extension.toLowerCase()
    return extension === 'mpd'
  }
  return false
}

export function isHls(url) {
  // An M3U file is a plain text file that specifies the locations of one or more media files. The file is saved with the "m3u" filename extension if the text is encoded in the local system's default non-Unicode encoding (e.g., a Windows codepage), or with the "m3u8" extension if the text is UTF-8 encoded.

  let extension = getExtension(url)
  if(extension) {
    extension = extension.toLowerCase()
    return extension === 'm3u' || extension === 'm3u8'
  }
  return false
}

export function mergeAdTagQueryStringParams(adTagUrl, newParams) {
  if(!adTagUrl) return null
  if(!newParams) return adTagUrl

  if(newParams && newParams.cust_params) {
    const adTagQueryString = adTagUrl.split('?')[1]
    const adTagParams = parseQueryString(adTagQueryString)
    const newCustParams = parseQueryString(decodeURIComponent(newParams.cust_params))

    let custParams = parseQueryString(decodeURIComponent(adTagParams.cust_params))
    if(!custParams) custParams = {}

    custParams = {
      ...custParams,
      ...newCustParams
    }

    newParams = {
      ...newParams,
      cust_params: encodeURIComponent(toQueryString(custParams))
    }
  }

  return mergeQueryStringParams(adTagUrl, newParams)
}

export function mergeQueryStringParams(url, newParams) {
  if(!url) return null
  if(!newParams) return url

  let queryString = url.split('?')[1]
  let params = { ...newParams }

  if(queryString) {
    params = {
      ...parseQueryString(queryString),
      ...newParams
    }
  }
  
  queryString = toQueryString(params)

  if(queryString) {
    return `${url.split('?')[0]}?${queryString}`
  } else {
    return `${url.split('?')[0]}`
  }
}

export function mergeQueryStringParamsBaracus(url, newParams) {
  if(typeof url !== 'string') return null
  if(!newParams) return url

  let baracusVars = parseQueryString(url)
  baracusVars.eid = encodeURIComponent(mergeQueryStringParams(decodeURIComponent(baracusVars.eid), newParams))

  return mergeQueryStringParams(url, baracusVars)
}

export function mergeQueryStringParamsSmart(url, newParams) {
  if(typeof url !== 'string') return null

  const vars = parseQueryString(url)

  if(Object.keys(vars).indexOf('eid') !== -1) {
    return mergeQueryStringParamsBaracus(url, newParams)
  } else {
    return mergeQueryStringParams(url, newParams)
  }
}

export function replaceValuesInUrl(url, replacements) {
  Object.keys(replacements).forEach((key) => {
    const encodedKey = `%7B${key}%7D`
    const regex = new RegExp(encodedKey, 'g')
    if (url.includes(encodedKey)) {
      if (replacements[key] !== null && replacements[key] !== undefined) {
        const encodedValue = encodeURIComponent(replacements[key])
        url = url.replace(regex, encodedValue)
      } else {
        // Elimina la clave de la URL si el valor es null o undefined
        url = url.replace(regex, '')
      }
      // Elimina la clave del objeto de reemplazos
      delete replacements[key]
    }
  })

  return url
}

export function parseQueryString(queryString) {
  if(typeof queryString !== 'string') return null

  if(queryString.indexOf('?') !== -1) {
    queryString = queryString.split('?')[1]
  }

  if(queryString) {
    let variables = {}

    queryString.split('&').forEach( (keyValueString) => {
      const arr = keyValueString.split('=')

      variables[arr[0]] = arr[1]
    })

    return { ...variables }
  }
  return null
}

export function toQueryString(obj) {
  if(!obj) return ''

  let queryString = ''

  for(let key in obj) {
    if(typeof obj[key] !== 'undefined') {
      queryString += `${key}=${obj[key]}&`
    }
  }
  return queryString.substr(0, queryString.length - 1)
}
