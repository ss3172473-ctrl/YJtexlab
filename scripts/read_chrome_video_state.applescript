set js to "JSON.stringify((() => { const v = document.querySelector('video'); if (!v) return { hasVideo: false, url: location.href }; return { hasVideo: true, url: location.href, currentSrc: v.currentSrc, paused: v.paused, muted: v.muted, autoplay: v.autoplay, loop: v.loop, readyState: v.readyState, networkState: v.networkState, currentTime: v.currentTime, ended: v.ended, width: v.videoWidth, height: v.videoHeight, visibilityState: document.visibilityState }; })())"

tell application "Google Chrome"
  execute front window's active tab javascript js
end tell
