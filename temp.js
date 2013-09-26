var ledbackpack = require('./lib/ledbackpack.js'),
	fs = require('fs');

var tempDevice = '/sys/bus/w1/devices/28-0000043a7cce/w1_slave';

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

function readTemp(callback) {
	"use strict";

	fs.readFile(tempDevice, function (err, buffer) {
		if (err) {
			throw (err);
		}

		// Read data from file (using fast node ASCII encoding).
		var data = buffer.toString('ascii').split(" "); // Split by space.

		// Extract temperature from string and divide by 1000 to give celsius.
		var temp = parseFloat(data[data.length - 1].split("=")[1]) / 1000.0;

		// Round to one decimal place.
		var rounded_temp = Math.round(temp * 10) / 10;

		if (rounded_temp === -0.1) {
			console.error('Probably an erroneous reading! Temperature sensor said -0.1. Ignoring this record.');
			return callback('sensor fail');
		}

		// Add date/time to temperature.
		var record = {
			unix_time: Date.now(),
			celsius: temp
		};

		// Execute call back with data.
		callback(null, record);
	});
}

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

// Put the init stuff on a timeout. Seems to take some milliseconds before
// writing to the display does not error.
setTimeout(function startClock() {
	"use strict";

	ledbackpack.init();
	ledbackpack.clear();
	ledbackpack.enableColon();
	ledbackpack.setBrightness(ledbackpack.MAX_BRIGHTNESS);
	ledbackpack.setBlinkRate(ledbackpack.BLINKRATE_OFF);

	setInterval(drawTemp, 1000);
	console.log('Temp sensor started.');
}, 1000);
