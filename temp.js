var ledbackpack = require('./lib/ledbackpack.js'),
	fs = require('fs');

var tempDevice   = '/sys/bus/w1/devices/28-0000043a7cce/w1_slave';

// The interval to read and redraw the display.
// Can override this.
var readDrawInterval = exports.readDrawInterval = 1000;

var lastGoodTemp = null;

// Get the last good reading. Can be retrieved by the client code.
var getLastGoodTemp = exports.getLastGoodTemp = function() {
	console.log('retrieving lastGoodTemp, which is ' + lastGoodTemp);
	return lastGoodTemp;
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

var readTemp = exports.readTemp = function readTemp(callback) {
	"use strict";

	console.log("starting to read tempDevice");
	fs.readFile(tempDevice, function (err, buffer) {
		if (err) {
			// should actually use the callback.
			throw (err);
		}

		console.log("got response from tempDevice");

		// Read data from file (using fast node ASCII encoding).
		var data = buffer.toString('ascii').split(" "); // Split by space.

		// Extract temperature from string and divide by 1000 to give celsius.
		var temp = parseFloat(data[data.length - 1].split("=")[1]) / 1000.0;

		// Round to one decimal place.
		var rounded_temp = Math.round(temp * 10) / 10;

		var has_error = false;
		if (rounded_temp === -0.1) {
			console.error('Probably an erroneous reading! Temperature sensor said -0.1. Ignoring this record.');
			has_error = true;
		}

		if (rounded_temp < -20 || rounded_temp > 100) {
			console.error('Probably an erroneous reading! Temperature sensor said ' + rounded_temp + '. Ignoring this record.');
			has_error = true;
		}

		var record;
		if (has_error) {
			console.log('Returning last good temperature (' + lastGoodTemp + ').');

			record = {
				unix_time: Date.now(),
				celsius: lastGoodTemp
			};
		} else {
			record = {
				unix_time: Date.now(),
				celsius: temp
			};

			lastGoodTemp = temp;
		}

		// Execute call back with data.
		return callback(null, record);
	});
};

function drawTemp() {
	"use strict";

	readTemp(function (err, tempRecord) {
		if (err) {
			console.log('Not using erroneous reading.');
			return;
		}

		console.log(tempRecord);

		// Round to 2 decimal places.
		// After, we are guaranteed to have a number of the form xxxxxx.xx
		var temp = parseFloat(tempRecord.celsius).toFixed(2);

		// Get whole degrees with leading zeros.
		var tempPieces = temp.split('.');

		// Add any leading zeros to the temperature.
		var wholeDegrees = zeroFill(tempPieces[0], 2);

		// The first two decimal places are everything after the period.
		var twoDecimalPlaces = tempPieces[1];

		ledbackpack.setDigit(0, wholeDegrees.charAt(0));
		ledbackpack.setDigit(1, wholeDegrees.charAt(1));

		ledbackpack.setDigit(3, String(twoDecimalPlaces).charAt(0));
		ledbackpack.setDigit(4, String(twoDecimalPlaces).charAt(1));
	});
}

console.log('Temp sensor starting...');

ledbackpack.init(function initSuccess() {
	ledbackpack.clear();
	ledbackpack.enableColon();
	ledbackpack.setBrightness(ledbackpack.MAX_BRIGHTNESS);
	ledbackpack.setBlinkRate(ledbackpack.BLINKRATE_OFF);

	console.log("Refreshing display at " + readDrawInterval + " intervals.");
	setInterval(drawTemp, readDrawInterval);
	console.log('Temp sensor started.');
});
