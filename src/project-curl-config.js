// Shared tuning for the site-wide DOM curl and the isolated WebGL preview.
export const CURL_OPTIONS=Object.freeze({
 maxStrength:.02, // Peak curl; 0 disables deformation without changing media fit.
 velocityReference:1200, // CSS viewport px / second
 attackMs:40, // Time constant for responding to faster scrolling.
 releaseMs:175, // Time constant for returning to the undistorted state.
 maxPixelRatio:1.5,
 maxCanvasWidth:2048,
 settleThreshold:.0005,
});
