import fetch from 'isomorphic-fetch'
import { errorTypes } from '../types'

const { ERROR_FETCH } = errorTypes

export default function fetchData(url, init = {}) {
  return new Promise((resolve, reject) => {
    const i = {
      dataType: 'json',
      method: 'GET',
      ...init
    }

    fetch(url, i)
    .then((response) => {
      if (response.ok) {
        if(response.status === 204) {
          resolve({})
        } else {
          return response.json()
        }
      } else {
        throw {
          message: `GET ${url} ${response.status} ${response.statusText}`,
          response
        }
      }
    })
    .then((json) => {
      resolve(json)
    })
    .catch((error) => {
      reject({
        type: ERROR_FETCH,
        info: {
          message: error.message,
          status: error.response && error.response.status
        },
        response: error.response
      })
    })
  })
}
