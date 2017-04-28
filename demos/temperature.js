/**
 * A demo showing how the LED backpack can be used to display temperatures.
 *
 * This demo refreshes the display every second with a new, higher temperature.
 */
const temperature = require('../temperature.js');

const refreshIntervalMs = 1000;

// Fake some temperature data.
let celsius = 18;

/* eslint no-console: 0 */
console.log(`Refreshing temperature display every 1000ms.`);

temperature.init();

/**
 * This is a stub which you'd replace with a real check from the temperature
 * probe.
 */
const readTemperature = () => {
  celsius += Math.random();
  console.log(`Read a temperature of ${celsius}°C.`);
  return celsius;
};

/**
 * Display the temperature on the LED backpack.
 */
const displayTemperature = () => {
  temperature.displayTemperature(readTemperature());
};

setInterval(displayTemperature, refreshIntervalMs);
