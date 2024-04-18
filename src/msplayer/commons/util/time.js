export function hhmmss(time, forceHours = false, forceMinutes = true, showSeconds = true) {
  time = Number(time)
  if (isNaN(time)) return ''
  if (time === Infinity) return ''
  if (time < 0) return ''

  let remainder = 0 // In seconds

  const hours = Math.floor(Number(time) / 3600) // 3600 seconds = 1 hour
  remainder = Math.floor(Number(time) % 3600)
  const minutes = Math.floor(remainder / 60) // 60 seconds = 1 minute
  const seconds = Math.floor(remainder % 60)

  let formattedTime = ''

  // Hours
  if (hours > 0 || forceHours) {
    if (hours < 10) {
      formattedTime += `0${hours}`
    } else {
      formattedTime += hours
    }
    if (minutes > 0 || forceMinutes) formattedTime += ':'
  }

  // Minutes
  if (minutes > 0 || forceMinutes) {
    if (minutes < 10) {
      formattedTime += `0${minutes}`
    } else {
      formattedTime += minutes
    }
    if (showSeconds) formattedTime += ':'
  }

  // Seconds
  if (showSeconds) {
    if (seconds < 10) {
      formattedTime += `0${seconds}`
    } else {
      formattedTime += seconds
    }
  }
  return formattedTime
}

// https://stackoverflow.com/questions/10087819/convert-date-to-another-timezone-in-javascript
export function timestampToHhmm(timestamp, timeZone = 'Europe/Madrid') {
  if(!timestamp) return ''

  const timeString = new Date(timestamp).toLocaleTimeString('es-ES', { timeZone })
  const timeData = timeString.split(':')

  let hours = parseInt(timeData[0])
  if(hours < 10) hours = `0${hours}`

  let minutes = parseInt(timeData[1])
  if(minutes < 10) minutes = `0${minutes}`

  return `${hours}:${minutes}`
}
