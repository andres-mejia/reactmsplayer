class Moat {
   static initMoat(adsManager, ids, adContainer, logger) {
     logger.info(`Iniciar Moat`)

     // Este snippet lo proporciona Moat
     /*Copyright (c) 2011-2016 Moat Inc. All Rights Reserved.*/
     function initMoatTracking(b,h,d){if(!1===h.hasOwnProperty("partnerCode"))return!1;var k=document.createElement("script");d=d||b&&("undefined"!==typeof b.O?b.O.parentNode:document.body)||document.body;var f=[],c={adsManager:b,ids:h,imaSDK:!0,events:[],dispatchEvent:function(a){var b=this.sendEvent,c=this.events;b?(c&&(c.push(a),a=c),b(a)):c.push(a)}},p={complete:"AdVideoComplete",firstquartile:"AdVideoFirstQuartile",impression:"AdImpression",loaded:"AdLoaded",midpoint:"AdVideoMidpoint",pause:"AdPaused",skip:"AdSkipped",start:"AdVideoStart",thirdquartile:"AdVideoThirdQuartile",volumeChange:"AdVolumeChange"};if(google&&google.ima&&b){var e="_moatApi"+Math.floor(1E8*Math.random()),l;for(l in google.ima.AdEvent.Type){var n=function(a){if(c.sendEvent){for(a=f.length-1;0<=a;a--)b.removeEventListener(f[a].type,f[a].func);c.sendEvent(c.events)}else c.events.push({type:p[a.type]||a.type,adVolume:b.getVolume()})};b.addEventListener(google.ima.AdEvent.Type[l],n);f.push({type:google.ima.AdEvent.Type[l],func:n})}}var e="undefined"!==typeof e?e:"",g,m;try{g=d.ownerDocument,m=g.defaultView||g.parentWindow}catch(a){g=document,m=window}m[e]=c;k.type="text/javascript";d&&d.appendChild(k);k.src="https://z.moatads.com/"+h.partnerCode+"/moatvideo.js#"+e;return c}

     initMoatTracking(adsManager, ids, adContainer)
   }
}

export default Moat
