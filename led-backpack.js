var rasp2c = require('rasp2c');

// i2c address of the 7-segment display.
// You can find this by running:
// i2cdetect -y 1
var display_address = '0x70';

// The list of available addresses for the visible elements of the display.
var addresses = ['0x00', '0x02', '0x04', '0x06', '0x08'];

// Hexadecimal character lookup table (row 1 = 0..9, row 2 = A..F)
var digits = [ 0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F,
  0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71 ];


// Base registers for system control.
var HT16K33_REGISTER_DISPLAY_SETUP        = 0x80;
var HT16K33_REGISTER_SYSTEM_SETUP         = 0x20;
var HT16K33_REGISTER_DIMMING              = 0xE0; // Base address for changing brightness.

// Blink rate
var HT16K33_BLINKRATE_OFF    = 0x00;
var HT16K33_BLINKRATE_2HZ    = 0x01;
var HT16K33_BLINKRATE_1HZ    = 0x02;
var HT16K33_BLINKRATE_HALFHZ = 0x03;

var clear = function () {
  "use strict";

  addresses.forEach(function (address) {
    rasp2c.set(display_address, address, '0x00', function (err, result) {
      if (err) {
        throw (err);
      }
    });
  });
};

// Set digit at to value.
var setDigit = function (pos, digit) {
  "use strict";

  if (isNaN(digit)) {
    console.log("Not attempting to set invalid digit '" + digit + "'");
    return;
  }


  rasp2c.set(display_address, addresses[pos], digits[digit], function (err, result) {
    if (err) {
      console.error('Error in setDigit with pos=' + pos + ' and digit=' + digit);
      throw (err);
    }
  });
};

// Set digit at pos to value.
var setRaw = function (pos, rawValue) {
  "use strict";

  rasp2c.set(display_address, addresses[pos], rawValue, function (err, result) {
    if (err) {
      console.error('Error in setRaw with pos=' + pos + ' and rawValue=' + rawValue);
      throw (err);
    }
  });
};

// Set digit at address to value.
var setRawAddress = function (address, rawValue) {
  "use strict";

  rasp2c.set(display_address, address, rawValue, function (err, result) {
    if (err) {
      throw (err);
    }
  });
};


// Enable the colon character.
function enableColon() {
  "use strict";

  // The colon character is at position index 2.
  rasp2c.set(display_address, addresses[2], '0x02', function (err, result) {
    if (err) {
      throw (err);
    }
  });
}

// Disable the colon character.
function disableColon() {
  "use strict";

  // The colon character is at position index 2.
  rasp2c.set(display_address, addresses[2], 0, function (err, result) {
    if (err) {
      throw (err);
    }
  });
}

// Sets the brightness level from 0 to 15.
var setBrightness = function (brightness) {
  "use strict";

  if (brightness > 15) {
    brightness = 15;
  }

  setRawAddress(HT16K33_REGISTER_DIMMING | brightness, 0x00);
};

// Sets the blink rate.
var setBlinkRate = function (blinkRate) {
  "use strict";

  if (blinkRate > HT16K33_BLINKRATE_HALFHZ) {
    blinkRate = HT16K33_BLINKRATE_OFF;
  }

  setRawAddress(HT16K33_REGISTER_DISPLAY_SETUP | 0x01 | (blinkRate << 1), 0x00);
};

// Sends the system setup message.
var init = exports.init = function (success) {
  "use strict";

  rasp2c.init(function initSuccess() {
    setRawAddress(HT16K33_REGISTER_SYSTEM_SETUP | 0x01, 0x00);
    success();
  });
}

exports.setDigit              = setDigit;
exports.setRaw                = setRaw;
exports.setRawAddress         = setRawAddress;
exports.clear                 = clear;
exports.enableColon           = enableColon;
exports.disableColon          = disableColon;
exports.setBrightness         = setBrightness;
exports.setBlinkRate          = setBlinkRate;

exports.MAX_BRIGHTNESS     = 15;
exports.BLINKRATE_OFF      = HT16K33_BLINKRATE_OFF;
exports.BLINKRATE_2HZ      = HT16K33_BLINKRATE_2HZ;
exports.BLINKRATE_1HZ      = HT16K33_BLINKRATE_1HZ;
exports.BLINKRATE_HALFHZ   = HT16K33_BLINKRATE_HALFHZ;
