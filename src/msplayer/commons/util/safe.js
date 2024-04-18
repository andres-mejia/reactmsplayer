export default function safePropertyName(str, addRandom = true) {
  const rnd = Math.round(Math.random() * 1000000)

  let safe = str.replace(/([^A-z0-9_])/gi, '')

  if (safe !== '') {
    if (safe.substr(0, 1).match(/[0-9]/gi)) {
      safe = `_${safe}`
    }
    if (addRandom) {
      safe += `_${rnd}`
    }
    return safe
  } else {
    return rnd
  }
}
