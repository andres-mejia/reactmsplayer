/* eslint-disable import/prefer-default-export */
export const accounts = (user) => new Promise((resolve) => {
  const { signatureTimestamp, uidSignature } = user
  const now = Math.floor(Date.now() / 1000)
  const userInfo = {
    signatureTimestamp,
    uidSignature
  }
  if ((!signatureTimestamp || !uidSignature) || Math.abs(now - signatureTimestamp) > 180) {
    window.gigya.accounts.getAccountInfo({
      callback: (response) => {
        if (response) {
          userInfo.uidSignature = response.UIDSignature
          userInfo.signatureTimestamp = response.signatureTimestamp
          resolve(userInfo)
        }
      }
    })
  } else {
    resolve(userInfo)
  }
})
