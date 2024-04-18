export function updateConsents(player) {
  return (onUpdated) => {
    const { consent } = player.props

    let isAdsConsented, isBluekaiConsented, isMoatConsented, isOmnitureConsented, isPermutiveConsented

    if(consent && consent.consentManager) {
      const {
        bluekai,
        consentManager,
        moat,
        omniture
      } = consent
      const { getConsent, getConsentForPersonalizedAds, getConsentPermutive } = consentManager

      isAdsConsented = (getConsentForPersonalizedAds && getConsentForPersonalizedAds())

      if(getConsent) {
        isBluekaiConsented = (bluekai && getConsent(bluekai.purpose, bluekai.vendor))
        isMoatConsented = (moat && getConsent(moat.purpose, moat.vendor))
        isOmnitureConsented = (omniture && getConsent(omniture.purpose, omniture.vendor))
      }
      if (getConsentPermutive) {
        isPermutiveConsented = getConsentPermutive()
      }
    }
     //If window.videoEmbedConsent.isConsent is true, then we are in AMP
     if (window?.videoEmbedConsent?.isConsent != undefined) {
      const consentAmp = getAMPConsent()
      isBluekaiConsented = consentAmp
      isMoatConsented = consentAmp
      isOmnitureConsented = consentAmp
      isPermutiveConsented = consentAmp
      isAdsConsented = consentAmp
    }

    player.setState({
      isAdsConsented,
      isBluekaiConsented,
      isMoatConsented,
      isOmnitureConsented,
      isPermutiveConsented
    }, () => onUpdated() )
  }
}

function getAMPConsent() {
  return (window?.videoEmbedConsent?.isConsent === true)
}
