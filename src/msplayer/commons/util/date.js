const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/i
const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function getDateMadrid(timeStamp) {
  if(timeStamp){
    let dateMadrid = new Date(timeStamp)
    dateMadrid.setHours(dateMadrid.getHours() + getMadridOffset(dateMadrid))

    const matched = DATE_PATTERN.exec(dateMadrid.toISOString()) || []

    if(Array.isArray(matched) && matched.length >= 7){
      return {
        year: matched[1],
        month: matched[2],
        day: matched[3],
        hours: matched[4],
        minutes: matched[5],
        seconds: matched[6],
        date: matched[0]
      }
    } else {
      return null
    }
  }
  return null
}

export function getHour() {
  const time = new Date()
  const date = getDateMadrid(time.getTime())

  return parseInt(date.hours)
}

export function getMadridOffset(timeStamp) {
  // Calculamos el último domingo de marzo
  let dateMarch = new Date(timeStamp.getFullYear(), 3, 1, 0, 2)
  dateMarch.setDate(dateMarch.getDate() - (dateMarch.getDay() === 0? 7 : dateMarch.getDay()))

  // Calculamos el último domingo de octubre
  let dateOctober = new Date(timeStamp.getFullYear(), 10, 1, 0, 2)
  dateOctober.setDate(dateOctober.getDate() - (dateOctober.getDay() === 0? 7 : dateOctober.getDay()))

  // Si la fecha está entre el último domingo de marzo y el último domingo de octubre el huso horario es +2 horas respecto a UTC, sino es +1
  return (timeStamp > dateMarch && timeStamp < dateOctober? 2 : 1)
}

export function getWeekday() {
  const time = new Date()
  const date = new Date(getDateMadrid(time.getTime()).date)
  const day = date.getDay()

  return WEEK_DAYS[day]
}
