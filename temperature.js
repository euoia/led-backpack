var ledBackpack = require('./led-backpack.js'),
  fs = require('fs');

const temperatureDevice = '/sys/bus/w1/devices/28-0000043a7cce/w1_slave';

// The interval to read and redraw the display.
// Can override this.
const readDrawInterval = exports.readDrawInterval = 1000;

var lastGoodTemperature = null;

// Get the last good reading. Can be retrieved by the client code.
const getLastGoodTemperature = exports.getLastGoodTemperature = () => {
  console.log('retrieving lastGoodTemperature which is ' + lastGoodTemperature);
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

const readTemperature = exports.readTemperature = (readTemperatureCallback) => {
  "use strict";

  console.log("starting to read temperatureDevice");
  fs.readFile(temperatureDevice, function (err, buffer) {
    if (err) {
      // should actually use the callback.
      throw (err);
    }

    console.log("got response from temperatureDevice");

    // Read data from file (using fast node ASCII encoding).
    var data = buffer.toString('ascii').split(" "); // Split by space.

    // Extract temperature from string and divide by 1000 to give celsius.
    var temperature = parseFloat(data[data.length - 1].split("=")[1]) / 1000.0;

    // Round to one decimal place.
    var rounded_temperature = Math.round(temperature * 10) / 10;

    var has_error = false;
    if (rounded_temperature === -0.1) {
      console.error('Probably an erroneous reading! Temperature sensor said -0.1. Ignoring this record.');
      has_error = true;
    }

    if (rounded_temperature < -20 || rounded_temperature > 100) {
      console.error('Probably an erroneous reading! Temperature sensor said ' + rounded_temperature + '. Ignoring this record.');
      has_error = true;
    }

    var record;
    if (has_error) {
      console.log('Returning last good temperature (' + lastGoodTemperature+ ').');

      record = {
        unix_time: Date.now(),
        celsius: lastGoodTemperature
      };
    } else {
      record = {
        unix_time: Date.now(),
        celsius: temperature
      };

      lastGoodTemperature= temperature;
    }

    // Execute call back with data.
    return readTemperatureCallback(null, record);
  });
};

function drawTemperature() {
  "use strict";

  readTemperature(function (err, temperatureRecord) {
    if (err) {
      console.log('Not using erroneous reading.');
      return;
    }

    console.log(temperatureRecord);

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

console.log('Temperature sensor starting...');

ledBackpack.init(function initSuccess() {
  ledBackpack.clear();
  ledBackpack.enableColon();
  ledBackpack.setBrightness(ledBackpack.MAX_BRIGHTNESS);
  ledBackpack.setBlinkRate(ledBackpack.BLINKRATE_OFF);

  console.log("Refreshing display at " + readDrawInterval + " intervals.");
  setInterval(drawTemperature, readDrawInterval);
  console.log('Temperature sensor started.');
});
