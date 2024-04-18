export function isObject(variable) {
  return Object.prototype.toString.call(variable) === '[object Object]'
}

export function stringToUint8Array(str) {
  if(!str) return null
  if(typeof str !== 'string') return null

  // 2 bytes for each char
  const buffer = new ArrayBuffer(str.length * 2)
  const arr = new Uint16Array(buffer)

  for(let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i)
  }
  return arr
}

export function uint8ArrayToString(arr) {
  if(!arr) return null
  return String.fromCharCode.apply(null, new Uint16Array(arr.buffer))
}
