const ledBackpack = require('./led-backpack.js');
const debug = require('debug')('led-backpack/temperature');

// Credit: http://stackoverflow.com/questions/1267283/how-can-i-create-a-zerofilled-value-using-javascript
function zeroFill(number, width) {
  "use strict";

  width -= number.toString().length;
  if (width > 0) {
    return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
  }

  // always return a string.
  return number + "";
}

/**
 * Read and display the current temperature.
 *
 * Store the temperature as lastGoodTemperature.
 *
 * @param {float} temperatureCelsius The temperature in celsius as a floating
 * point number.
 */
exports.displayTemperature = (temperatureCelsius) => {
  "use strict";

  debug(`Displaying temperature ${temperatureCelsius}`);

  // Round to 2 decimal places.
  // After, we are guaranteed to have a number of the form xxxxxx.xx
  var temperature = parseFloat(temperatureCelsius).toFixed(2);

  // Get whole degrees with leading zeros.
  var temperaturePieces = temperature.split('.');

  // Add any leading zeros to the temperature.
  var wholeDegrees = zeroFill(temperaturePieces[0], 2);

  // The first two decimal places are everything after the period.
  var twoDecimalPlaces = temperaturePieces[1];

  ledBackpack.setDigit(0, wholeDegrees.charAt(0));
  ledBackpack.setDigit(1, wholeDegrees.charAt(1));

  ledBackpack.setDigit(3, String(twoDecimalPlaces).charAt(0));
  ledBackpack.setDigit(4, String(twoDecimalPlaces).charAt(1));
}

exports.init = () => {
  ledBackpack.clear();

  // We don't actually want a colon - we want a decimal place, but there's no
  // way to independently control that dot so you'll have to put a piece of
  // blu-tack over it.
  ledBackpack.enableColon();
  ledBackpack.setBrightness(ledBackpack.MAX_BRIGHTNESS);
  ledBackpack.setBlinkRate(ledBackpack.BLINKRATE_OFF);
};
