const ledBackpack = require('./led-backpack.js');
const fs = require('fs');
const debug = require('debug')('led-backpack');

const temperatureDevice = '/sys/bus/w1/devices/28-0000043a7cce/w1_slave';

var lastGoodTemperature = null;

// Get the last good reading. Can be retrieved by the client code.
exports.getLastGoodTemperature = () => {
  return lastGoodTemperature
};


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

const readTemperature = exports.readTemperature = (readTemperatureCallback = function () {}) => {

  fs.readFile(temperatureDevice, function (err, buffer) {
    if (err) {
      debug('Error reading from temperature device.');
      // should actually use the callback.
      return readTemperatureCallback (err.stack);
    }

    // Read data from file (using fast node ASCII encoding).
    var data = buffer.toString('ascii').split(" "); // Split by space.

    // Extract temperature from string and divide by 1000 to give celsius.
    var temperature = parseFloat(data[data.length - 1].split("=")[1]) / 1000.0;

    // Round to one decimal place.
    var rounded_temperature = Math.round(temperature * 10) / 10;

    var has_error = false;
    if (rounded_temperature === -0.1) {
      debug('Probably an erroneous reading! Temperature sensor said -0.1. Ignoring this record.');
      has_error = true;
    }

    if (rounded_temperature < -20 || rounded_temperature > 100) {
      debug('Probably an erroneous reading! Temperature sensor said ' + rounded_temperature + '. Ignoring this record.');
      has_error = true;
    }

    var record;
    if (has_error) {
      debug('Returning last good temperature (' + lastGoodTemperature+ ').');

      record = {
        unix_time: Date.now(),
        celsius: lastGoodTemperature
      };
    } else {
      record = {
        unix_time: Date.now(),
        celsius: temperature
      };

      lastGoodTemperature = temperature;
    }

    // Execute call back with data.
    return readTemperatureCallback(null, record);
  });
};

/**
 * Read and display the current temperature.
 *
 * Store the temperature as lastGoodTemperature.
 */
function refreshTemperature() {
  "use strict";

  readTemperature(function (err, temperatureRecord) {
    if (err) {
      debug('Not using erroneous reading.');
      return;
    }

    // Round to 2 decimal places.
    // After, we are guaranteed to have a number of the form xxxxxx.xx
    var temperature = parseFloat(temperatureRecord.celsius).toFixed(2);

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
  });
}

exports.init = (options = {}) => {
  const refreshInterval = options.refreshInterval || 1000;

  ledBackpack.clear();
  ledBackpack.enableColon();
  ledBackpack.setBrightness(ledBackpack.MAX_BRIGHTNESS);
  ledBackpack.setBlinkRate(ledBackpack.BLINKRATE_OFF);
  readTemperature();

  setInterval(refreshTemperature, refreshInterval);
};
