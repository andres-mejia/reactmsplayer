import { List } from 'immutable'
import { findRandomInt } from './random'

export function findClosest(value, arr, criteria = 'round') {
  if(isNaN(value)) return arr[0]
  if(value <= arr[0]) return arr[0]
  if(value >= arr[arr.length - 1]) return arr[arr.length - 1]

  const index = Math.floor(arr.length / 2)
  const item1 = arr[index]

  if(value > item1) {
    const item2 = arr[index + 1]

    if(value < item2) {
      if(criteria === 'floor') {
        return item1
      } else if(criteria === 'ceil') {
        return item2
      } else {
        return value - item1 < item2 - value ? item1 : item2
      }
    } else {
      return findClosest(value, arr.slice(index), criteria)
    }
  } else {
    if(index === 0) return item1

    const item2 = arr[index - 1]

    if(value > item2) {
      if(criteria === 'floor') {
        return item2
      } else if(criteria === 'ceil') {
        return item1
      } else {
        return item1 - value < value - item2 ? item1 : item2
      }
    } else {
      return findClosest(value, arr.slice(0, index), criteria)
    }
  }
}

export function findRandomItem(arr) {
  if(!Array.isArray(arr) || arr.length === 0) return null
  if(arr.length === 1) return arr[0]

  return arr[findRandomInt(0, arr.length - 1)]
}

export function pushNonRedundant(arr, item) {
  if (arr instanceof List) {
    if (arr.last() != item) {
      return arr.push(item)
    }
  } else {
    if (arr[arr.length - 1] != item) {
      arr.push(item)
    }
  }
  return arr
}
