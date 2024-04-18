// Implements Conviva.StorageInterface

// HTML5 localStorage relies on a single key to index items,
// so we find a consistent way to combine storageSpace and storageKey.

export default function ConvivaStorage() {

  function _constr() {
    // nothing to initialize
  }

  _constr.apply(this, arguments)

  this.saveData = function (storageSpace, storageKey, data, callback) {
    var localStorageKey = `${storageSpace}.${storageKey}`
    try {
      localStorage.setItem(localStorageKey, data)
      callback(true, null)
    } catch (e) {
      callback(false, e.toString())
    }
  }

  this.loadData = function (storageSpace, storageKey, callback) {
    var localStorageKey = `${storageSpace}.${storageKey}`
    try {
      var data = localStorage.getItem(localStorageKey)
      callback(true, data)
    } catch (e) {
      callback(false, e.toString())
    }
  }

  this.release = function() {
    // nothing to release
  }
}
