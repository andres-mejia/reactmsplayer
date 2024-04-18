// v. http://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
// v. https://stackoverflow.com/questions/34045777/copy-to-clipboard-using-javascript-in-ios
export function copyToClipboard(text, isIos) {
  const textArea = document.createElement("textarea")

  let succeeded = undefined

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a flash,
  // so some of these are just precautions. However in IE the element
  // is visible whilst the popup box asking the user for permission for
  // the web page to copy to the clipboard.
  //

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed'
  textArea.style.top = 0
  textArea.style.left = 0

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em'
  textArea.style.height = '2em'

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0

  // Clean up any borders.
  textArea.style.border = 'none'
  textArea.style.outline = 'none'
  textArea.style.boxShadow = 'none'

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent'

  textArea.contentEditable = true
  textArea.readOnly = false

  textArea.value = text

  document.body.appendChild(textArea)

  if(isIos) {
    const range = document.createRange()
    const selection = window.getSelection()

    range.selectNodeContents(textArea)

    selection.removeAllRanges()
    selection.addRange(range)

    textArea.setSelectionRange(0, 999999)
  } else {
    textArea.select()
  }

  try {
    succeeded = document.execCommand('copy')
  } catch(error) {
    succeeded = false

    console.error(error)
  }

  document.body.removeChild(textArea)

  return succeeded
}

export function getElementParents(element, className) {
  while (element && element.parentNode) {
    const regExp = new RegExp(`(^${className}$|^${className} | ${className} | ${className}$)`, 'gi')

    element = element.parentNode

    if (element.className && element.className.search(regExp) !== -1) {
      return element
    }
  }
  return null
}

/*
 * v. http://stackoverflow.com/questions/5598743/finding-elements-position-relative-to-the-document
 */
export function getElementPosition(element) {
  const box = element.getBoundingClientRect()

  const body = document.body
  const docElement = document.documentElement

  const scrollTop = window.pageYOffset || docElement.scrollTop || body.scrollTop
  const scrollLeft = window.pageXOffset || docElement.scrollLeft || body.scrollLeft

  const clientTop = docElement.clientTop || body.clientTop || 0
  const clientLeft = docElement.clientLeft || body.clientLeft || 0

  const top = box.top + scrollTop - clientTop
  const left = box.left + scrollLeft - clientLeft

  return {
    x: Math.round(left),
    y: Math.round(top)
  }
}

/*
 * v. http://callmenick.com/post/cross-browser-calculation-of-x-y-position
 */
export function getMousePosition(e) {
  let posX = 0
  let posY = 0

  if(!e) e = window.event
  if(!e) return null

  if(e.touches) {
    if(e.touches.length) {
      e = e.touches
    } else {
      return null
    }
  }

  if(e.pageX || e.pageY) {
    posX = e.pageX
    posY = e.pageY
  } else if (e.clientX || e.clientY) {
    posX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
    posY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop
  }

  return {
    x: posX,
    y: posY
  }
}

export function getScreenResolution() {
  if(typeof window !== 'undefined' && window.screen){
    return { width: window.screen.width, height: window.screen.height }
  } else {
    return null
  }
}

export function getVisibilityChangeEvent() {
  if(typeof document === 'undefined') return null

  if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support 
    return 'visibilitychange'
  } else if (typeof document.msHidden !== 'undefined') {
    return 'msvisibilitychange'
  } else if (typeof document.webkitHidden !== 'undefined') {
    return 'webkitvisibilitychange'
  }
  return null
}

export function isDocumentHidden() {
  if(typeof document !== 'undefined') {
    return !!(document.hidden || document.msHidden || document.webkitHidden)
  }
  return true
}

// https://gomakethings.com/how-to-test-if-an-element-is-in-the-viewport-with-vanilla-javascript/
export function isInViewport(element) {
  if(typeof window !== 'undefined') {
    const bounding = element.getBoundingClientRect()

    return (
      bounding.top >= 0 &&
      bounding.top <= (window.innerHeight || document.documentElement.clientHeight) ||
      bounding.bottom >= 0 &&
      bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    )
    // return (
    //   bounding.top >= 0 &&
    //   bounding.left >= 0 &&
    //   bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    //   bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    // )
  } else {
    return false
  }
}

export function isInBoundary(position, rectangle) {
  return !!(
    position.x >= rectangle.x && position.x <= rectangle.x + rectangle.width &&
    position.y >= rectangle.y && position.y <= rectangle.y + rectangle.height
  )
}
