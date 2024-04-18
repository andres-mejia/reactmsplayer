import { errorTypes } from '../types'

const { 
  ERROR_CONTENT_MULTICHANNEL_GEOBLOCKED,
  ERROR_CONTENT_NOT_ALLOWED,
  ERROR_CONTENT_NOT_PURCHASED,
  ERROR_USER_CHECK_PRIVILEGES,
  ERROR_USER_NOT_LOGGED
} = errorTypes

export function parseProgramChangeError(type) {
  let typeError = ''
  switch (type) {
    case 'error':
      typeError = ERROR_USER_CHECK_PRIVILEGES
    break

    case 'login':
      typeError = ERROR_USER_NOT_LOGGED
    break

    case 'offers':
      typeError = ERROR_CONTENT_NOT_PURCHASED
    break

    case 'geo':
      typeError = ERROR_CONTENT_MULTICHANNEL_GEOBLOCKED
    break

    case 'rights':
    default:
      typeError = ERROR_CONTENT_NOT_ALLOWED
    break
  }
  return typeError
}