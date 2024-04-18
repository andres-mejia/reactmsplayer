/* eslint-disable no-eval */
import { mergeQueryStringParams, parseQueryString } from '../../../commons/util'
import { adGenres } from '../../../commons/types'

const { MID_ROLL, POST_ROLL, PRE_ROLL } = adGenres

export const getGenres = (genre) => (!genre ? 'No informado'
  : genre.split('|').join(', '))

export const getNewVar31 = (url) => {
  const baseUrl = url.split('?')[0]
  const queryStringParams = parseQueryString(url)

  if (queryStringParams.fbclid) {
    delete queryStringParams.fbclid
  }

  return mergeQueryStringParams(baseUrl, queryStringParams)
}

const getFormatDate = (data) => {
  let day = data.getDate()
  if (day < 10) {
    day = `0${day}`
  }
  let month = data.getMonth()
  month += 1
  if (month < 10) {
    month = `0${month}`
  }
  const year = data.getFullYear()

  return `${year}-${month}-${day}`
}

export const hasJSCode = (value) => !!value?.includes('{{')

const isExactlySameDay = (pDate, aDate) => pDate.getDate() === aDate.getDate()
&& pDate.getMonth() === aDate.getMonth()
&& pDate.getFullYear() === aDate.getFullYear()

export const parseAdGenre = (adGenre) => {
  switch (adGenre) {
    case PRE_ROLL:
      return 'pre-roll'

    case MID_ROLL:
      return 'mid-roll'

    case POST_ROLL:
      return 'post-roll'
    default:
      return null
  }
}

export const evalConfigAttribute = (attr) => {
  if (typeof attr === 'string' && attr.slice(0, 2) === '{{' && attr.slice(-2) === '}}') {
    return eval(attr)
  }
  return attr
}

export const accounts = (user) => new Promise((resolve) => {
  const { signatureTimestamp, uidSignature } = user
  const now = Math.floor(Date.now() / 1000)
  const userInfo = {
    signatureTimestamp,
    uidSignature
  }
  if ((!signatureTimestamp || !uidSignature) || Math.abs(now - signatureTimestamp) > 180) {
    window.gigya.accounts.getAccountInfo({
      callback: (response) => {
        if (response) {
          userInfo.uidSignature = response.UIDSignature
          userInfo.signatureTimestamp = response.signatureTimestamp
          resolve(userInfo)
        }
      }
    })
  } else {
    resolve(userInfo)
  }
})

export const transformToCustomObject = (obj) => {
  if (!obj) return {}

  const finalObj = {}

  Object.keys(obj).forEach((key) => {
    const parsedKey = key.replace(/^v/, 'eVar')
    finalObj[parsedKey] = evalConfigAttribute(obj[key])
  })

  return finalObj
}

export const getDaysFromPublicationDate = (publiDate) => {
  if (!publiDate || publiDate === null) return 'No Informado'

  const publicationDate = new Date(getFormatDate(new Date(publiDate)))
  const actualDate = new Date()

  const diffDays = -(publicationDate.getTime() - actualDate.getTime())

  let finalDiffDays = Math.round(diffDays / (1000 * 60 * 60 * 24))

  if (finalDiffDays === 1) {
    if (isExactlySameDay(publicationDate, actualDate)) {
      finalDiffDays = 0
    }
  }

  return finalDiffDays === 0 ? 'CERO' : finalDiffDays
}

export const getEvar49 = (isNextVideo, isNextVideoPlayback, carouselType, topVideo) => {
  if (carouselType) return carouselType
  if (isNextVideo && isNextVideoPlayback) return 'Siguiente capitulo'
  if (isNextVideo) return 'Autoplay'
  if (topVideo) return 'Top videos contenedor'
  // Añadir comprobaciones del Top Videos
  return 'Otros'
}

export const getEvar80 = (isNextVideo) => (isNextVideo ? 'No' : 'Si')

export const getEvar102 = (eVar49Value, isButtonVisible) => {
  if (eVar49Value === 'Autoplay' || eVar49Value === 'Siguiente capitulo') { return 'Con botón' }
  if (isButtonVisible) return 'Con botón'
  return 'Sin botón'
}

export const getEvar121 = (type, index, isNextVideo, isNextVideoPlayback,topVideo) => {
  if (topVideo && !isNextVideo && !isNextVideoPlayback) return `Top videos contenedor|${topVideo}`
  if (!type) return 'No aplica'
  return`${type}|${index + 1}`
}

export const getEvar124 = (totalVideoCount) => totalVideoCount || '1'
