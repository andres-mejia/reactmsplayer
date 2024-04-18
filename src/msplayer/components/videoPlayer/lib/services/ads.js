const VIDEO_MAX_LENGTH = 5 * 60

async function get(url) {
  try {
    const response = await fetch(url)
    return response.json()
  } catch (e) {
    const error = {
      code: 'ERR',
      statusCode: 500,
      message: e.message || '[GET] Error FETCH AdPause info'
    }
    throw error
  }
}

async function getAdPauseAdInfo(url, logger) {
  try {
    const response = await get(url)
    return response
  } catch (e) {
    logger.error({ where: '[getAdPauseAdInfoAsync] Error al recuperar la info de adPause', params: { url, msg: e.message, error: e } })
    return {}
  }
}

async function loadAdPauseInfo(url, logger) {
  try {
    const response = await getAdPauseAdInfo(url, logger)
    return response
  } catch (e) {
    logger.error({ where: '[loadAdPauseInfo] Error FETCH AdPause info', params: { url, msg: e.message, error: e } })
    return {}
  }
}

function callAdPauseInfo({state, props}) {
  const {
    duration,
    isAdsEnabled,
    isAdsConsented
  } = state
  const { isPremium } = props
  const isLongForm = duration > VIDEO_MAX_LENGTH

  return !isPremium && isAdsEnabled && isAdsConsented && isLongForm
}

export { loadAdPauseInfo, callAdPauseInfo }
