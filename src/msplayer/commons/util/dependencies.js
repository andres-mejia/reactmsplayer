export default function waitFor(evalCondition, delay = 60000) {
  return new Promise((resolve, reject) => {
    if (evalCondition()) {
      resolve()
    } else {
      const timeout = window.setTimeout(() => {
        clearInterval(interval)

        if (evalCondition()) {
          resolve()
        } else {
          reject()
        }
      }, delay)

      const interval = window.setInterval( () => {
        if (evalCondition()) {
          clearTimeout(timeout)
          clearInterval(interval)

          resolve()
        }
      }, 300)
    }
  })
}
