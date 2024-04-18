import typeBuilder from '../helper'

export default typeBuilder([
  // Timeout iniciando el bloque de publicidad. Por defecto: 2 min
  'ERROR_AD_SLOT_START_TIMEOUT',
  // No se ha encontrado URL del ad-tag de DFP
  'ERROR_AD_TAG_URL_NOT_FOUND',
  // Error en la petición del servicio Ads
  'ERROR_ADS_FETCH',
  // Error desconocido al inicializar el servicios Ads
  'ERROR_ADS_INIT_UNKNOWN',
  // Timeout esperando que la librería IMA SDK esté disponible
  'ERROR_ADS_IMA_SDK_TIMEOUT',
  // player.adsInstance no encontrado
  'ERROR_ADS_INSTANCE_NOT_FOUND',
  // Error genérico iniciando la publicidad IMA
  'ERROR_ADS_START',
  // Timeout al iniciar reproducción de publicidad IMA
  'ERROR_ADS_START_TIMEOUT',
  // No se ha encontrado la URL del servicio Ads
  'ERROR_ADS_URL_NOT_FOUND',
  // No existe la instancia de vídeo necesaria para crear el AdDisplayContainer de IMA SDK
  'ERROR_ADS_VIDEO_INSTANCE_NOT_FOUND',
  // (Fatal) Error en la petición al servicio Cerbero
  'ERROR_CERBERO_FETCH',
  // (Fatal) Error en la respuesta de Cerbero: no se ha encontrado el atributo 'tokens'
  'ERROR_CERBERO_SCHEMA',
  // (Fatal) Error al recuperar el Config
  'ERROR_CONFIG_FETCH',
  // (Fatal) Error desconocido al inicializar el Config
  'ERROR_CONFIG_INIT_UNKNOWN',
  // No se ha encontrado 'services.ads' en la respuesta del servicio Config
  'ERROR_CONFIG_RESPONSE_ADS_NOT_FOUND',
  // (Fatal) No se ha encontrado 'services' en la respuesta del servicio Config
  'ERROR_CONFIG_RESPONSE_SERVICES_NOT_FOUND',
  // (Fatal) No se ha encontrado 'services.src' ni 'services.caronte' ni 'services.mmc' en la respuesta del servicio Config
  'ERROR_CONFIG_RESPONSE_STREAM_NOT_FOUND',
  // (Fatal) Error desconocido al inicializar el Config
  'ERROR_CONFIG_UNKNOWN',
  // (Fatal) No se ha encontrado la URL del Config
  'ERROR_CONFIG_URL_NOT_FOUND',
  // (Fatal) El contenido está geobloqueado en el área geográfica del usuario
  'ERROR_CONTENT_GEOBLOCKED',
  // (Fatal) El contenido está geobloqueado en el área geográfica del usuario en Multicanal
  'ERROR_CONTENT_MULTICHANNEL_GEOBLOCKED',
  // (Fatal) El usuario no tiene permisos para reproducir este contenido después de un cambio de programa al vuelo en un directo
  'ERROR_CONTENT_NOT_ALLOWED',
  // (Fatal) El contenido no tiene associado ofertas para determinada región
  'ERROR_CONTENT_NOT_OFFERS_REGION',
  // (Fatal) El usuario no ha comprado el contenido
  'ERROR_CONTENT_NOT_PURCHASED',
  // Error en publicidad DAI
  'ERROR_DAI_ADS',
  // (Fatal) No se ha declarado la instancia de Dai necesaria para pedir la URL del stream
  'ERROR_DAI_CONTROLLER_NOT_FOUND',
  // (Fatal) Error al intentar crear la instancia de 'window.google.ima.dai.api.StreamManager' en 'DAI.init'
  'ERROR_DAI_INIT',
  // (Fatal) Se ha recibido un evento de error después de llamar a 'StreamManager.requestStream' en 'DAI.requestUrl'
  'ERROR_DAI_REQUEST_STREAM',
  // (Fatal) Se ha recibido un evento desconocido después de llamar a 'StreamManager.requestStream' en 'DAI.requestUrl'
  'ERROR_DAI_REQUEST_STREAM_UNKNOWN_EVENT',
  // (Fatal) Timeout esperando que la librería IMA-DAI SDK esté disponible
  'ERROR_DAI_SDK_TIMEOUT',
  // (Fatal) No hay URL del stream en la respuesta a 'StreamManager.requestStream' en 'DAI.requestUrl'
  'ERROR_DAI_STREAM_NOT_FOUND',
  // (Fatal) Error detectado en Dash.js
  'ERROR_DASHJS',
  // (Fatal) Dash.js no es compatible con el navegador
  'ERROR_DASHJS_NOT_SUPPORTED',
  // (Fatal) Timeout esperando el SDK de Dash.js
  'ERROR_DASHJS_SDK_TIMEOUT',
  // (Fatal) Error al recuperar el Delivery
  'ERROR_DELIVERY_FETCH',
  // Error desconocido al inicializar el servicios Delivery
  'ERROR_DELIVERY_INIT_UNKNOWN',
  // (Fatal) La respuesta del servicio Delivery no contiene 'dls' ni 'locations'
  'ERROR_DELIVERY_RESPONSE_NO_LOCATIONS',
  // (Fatal) No se ha encontrado la URL del Delivery
  'ERROR_DELIVERY_URL_NOT_FOUND',
  // (Fatal) Error en la petición del certificado FairPlay
  'ERROR_DRM_CERTIFICATE_FETCH',
  // (Fatal) No se ha encontrado la URL del certificado FairPlay
  'ERROR_DRM_CERTIFICATE_URL_NOT_FOUND',
  // (Fatal) Error de DRM detectado por cualquier media player. Incluye códigos de error
  'ERROR_DRM_GENERIC',
  // (Fatal) No se ha recibido initData en el evento 'encrypted' | 'webkitneedkey'
  'ERROR_DRM_INIT_DATA_NOT_FOUND',
  // (Fatal) Error al crear sesión en la mediaKey del vídeo: 'webkitkeyerror'
  'ERROR_DRM_KEY_SESSION',
  // (Fatal) El tipo de DRM no es compatible con el navegador
  'ERROR_DRM_KEY_SYSTEM_NOT_SUPPORTED',
  // (Fatal) Permiso de licencia DRM denegado
  'ERROR_DRM_LICENSE_AUTHORIZATION_DENIED',
  // (Fatal) Error en la petición de la licencia DRM
  'ERROR_DRM_LICENSE_FETCH',
  // (Fatal) No se ha recibido la URL de la licencia DRM
  'ERROR_DRM_LICENSE_NOT_FOUND',
  // (Fatal) Error de concurrencia
  'ERROR_DRM_TOO_MANY_CONCURRENT_STREAMS',
  // (Fatal) El dispositivo/navegador no permite acceso al key system
  'ERROR_DRM_KEY_SYSTEM_ACCESS_DENIED',
  // El player recibe un evento de fin de contenido en un recurso live
  'ERROR_LIVE_ENDED',
  // Error en fetch
  'ERROR_FETCH',
  // (Fatal) Error en la petición al servicio Cerbero/Gatekeeper
  'ERROR_GATEKEEPER_FETCH',
  // (Fatal) La respuesta del servicio Gatekeeper tiene una estructura distinta a la esperada. No contiene 'suffix' ni 'stream'
  'ERROR_GATEKEEPER_SCHEMA',
  // (Fatal) Error desconocido al inicializar Gatekeeper
  'ERROR_GATEKEEPER_UNKNOWN',
  // (Fatal) No se ha encontrado la instancia de Hls.js que se necesitaba
  'ERROR_HLSJS_INSTANCE_NOT_FOUND',
  // (Fatal) Error relacionado con el recurso multimedia en Hls.js
  'ERROR_HLSJS_MEDIA',
  // (Fatal) Error de conexión detectado por Hls.js
  'ERROR_HLSJS_NETWORK',
  // (Fatal) Hls.js no es compatible con el navegador
  'ERROR_HLSJS_NOT_SUPPORTED',
  // (Fatal) Error fatal genérico en Hls.js
  'ERROR_HLSJS_OTHER_FATAL',
  // (Fatal) Timeout SDK Hls.js
  'ERROR_HLSJS_SDK_TIMEOUT',
  // (Fatal) No hay "location" disponible en la posición buscada. Probablemete debido a que se han probado ya todos los disponibles
  'ERROR_LOCATION_NOT_FOUND',
  // (Fatal) The fetching of the associated resource has been aborted by the user
  'ERROR_MEDIA_ABORTED',
  // (Fatal) A decoding error caused the resource to stop being fetched
  'ERROR_MEDIA_DECODE',
  // (Fatal) A network error caused the resource to stop being fetched
  'ERROR_MEDIA_NETWORK',
  // (Fatal) Error al llamar a 'play' en la instancia de HTMLVideoElement
  'ERROR_MEDIA_PLAY_ABORT',
  // (Fatal) Error al llamar a play
  'ERROR_MEDIA_PLAY_NOT_ALLOWED',
  // (Fatal) Error al llamar a play
  'ERROR_MEDIA_PLAY_NOT_SUPPORTED',
  // (Fatal) Error genérico al llamar a 'play' en la instancia de HTMLVideoElement
  'ERROR_MEDIA_PLAY_UNKNOWN',
  // (Fatal) No se ha podido crear una instancia de ningún media player para reproducir el contenido
  'ERROR_MEDIA_PLAYER_NOT_CREATED',
  // (Fatal) The associated resource has been detected to be not suitable
  'ERROR_MEDIA_SRC_NOT_SUPPORTED',
  // (Fatal) Se recibe un evento 'suspend' y la reproducción está congelada
  'ERROR_MEDIA_SUSPEND',
  // (Fatal) Error de HTMLVideoElement desconocido
  'ERROR_MEDIA_UNKNOWN',
  // (Fatal) Timeout al iniciar el player
  'ERROR_PLAYER_START_TIMEOUT',
  // (Fatal) Timeout procesando recovery del player
  'ERROR_RECOVERY_TIMEOUT',
  // Error al recuperar uno de los servicios de datos
  'ERROR_SERVICE_FETCH',
  // (Fatal) Error desconocido al recuperar el servicio de datos
  'ERROR_SERVICE_INIT_UNKNOWN',
  // No se ha encontrado la URL del servicio
  'ERROR_SERVICE_URL_NOT_FOUND',
  // (Fatal) Error al recuperar/almacenar/parsear los servicios de datos obligatorios para inicializar el player
  'ERROR_SERVICES_INIT',
  // (Fatal) Error detectado por Shaka Player. Incluye códigos de error
  'ERROR_SHAKA',
  // (Fatal) No se ha encotrado la instancia de Shaka Player necesaria
  'ERROR_SHAKA_INSTANCE_NOT_FOUND',
  // (Fatal) Navegador no compatible con Shaka Player
  'ERROR_SHAKA_NOT_SUPPORTED',
  // (Fatal) Timeout SDK de Shaka Player
  'ERROR_SHAKA_SDK_TIMEOUT',
  // En el momento de intentar reproducir el starter src, el Video.src no contiene la URL adecuada
  'ERROR_STARTER_SRC_NOT_SET',
  // Error al reproducir el starter src
  'ERROR_STARTER_SRC_PLAYBACK',
  // No existía instancia de HTMLVideoElement en el momento de reproducir el starter src
  'ERROR_STARTER_SRC_VIDEO_INSTANCE_NOT_FOUND',
  // (Fatal) Error desconocido o no definido
  'ERROR_UNKNOWN',
  // (Fatal) Cuando alguna de las llamadas que se realizan para comprobar los permisos del usuario devuelve un error
  'ERROR_USER_CHECK_PRIVILEGES',
  // (Fatal) Respuesta 4039 de Cerbero
  'ERROR_USER_MAX_SESSIONS_REACHED',
  // (Fatal) Respuesta 4038 de Cerbero
  'ERROR_USER_NO_PRIVILEGES',
  // (Fatal) Cuando es un contenido bajo registro y el usuario no esta logado
  'ERROR_USER_NOT_LOGGED',
  // (Fatal) Respuesta 4033 de Cerbero
  'ERROR_USER_NOT_VALID',
  // (Fatal) No se encuentra la instancia de HTMLVideoElement necesaria
  'ERROR_VIDEO_INSTANCE_NOT_FOUND',
])
