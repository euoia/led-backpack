var ledbackpack = require('./ledbackpack.js');

// Credit: http://stackoverflow.com/questions/1267283/how-can-i-create-a-zerofilled-value-using-javascript
function zeroFill(number, width) {
  "use strict";

  width -= number.toString().length;
  if (width > 0) {
    return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
  }

  // always return a string.
  return String(number);
}


function drawClock() {
  "use strict";

  var now = new Date();
  var hour = zeroFill(now.getHours(), 2);
  var minutes = zeroFill(now.getMinutes(), 2);

  ledbackpack.setDigit(0, hour.charAt(0));
  ledbackpack.setDigit(1, hour.charAt(1));
  ledbackpack.setDigit(3, minutes.charAt(0));
  ledbackpack.setDigit(4, minutes.charAt(1));
}

console.log('Clock starting...');

// Put the init stuff on a timeout. Seems to take some milliseconds before
// writing to the display does not error.
setTimeout(function startClock() {
  "use strict";
  ledbackpack.init();
  ledbackpack.clear();
  ledbackpack.enableColon();
  ledbackpack.setBrightness(ledbackpack.MAX_BRIGHTNESS);
  ledbackpack.setBlinkRate(ledbackpack.BLINKRATE_OFF);

  setInterval(drawClock, 1000);
  console.log('Clock started.');
}, 1000);


