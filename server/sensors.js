var mraa = require('mraa');
var sensors = require('jsupm_grove');
var gasSensorLibrary = require('jsupm_gas');
var GAS_THRESHOLD = 400;


var tempSensor = new sensors.GroveTemp(0);
var lightSensor = new sensors.GroveLight(1);
var rotarySensor = new sensors.GroveRotary(2);
var gasSensor = new gasSensorLibrary.MQ5(3);
var ledSensor = new sensors.GroveLed(3);
var buzzerSensor = new mraa.Gpio(5);
var touchSensor = new mraa.Gpio(6);

// Configure GPIO direction
buzzerSensor.dir(mraa.DIR_OUT);
touchSensor.dir(mraa.DIR_IN);

//var buzzerSensorState = 0;
//var panicMode = false;
//var intervalPanicMode;
//var ledState = 'off';

// Initialize sensors
//buzzerSensor.write(0);
//ledSensor.off();

module.exports = {
    platformStatus: {
        temperature: [],
        gas: [],
        light: [],
        moisture: [],
        water: [],
        airQuality: [],
        music: []
    },
    sensors: {
        temperature: tempSensor,
        light: lightSensor,
        gas: gasSensor,
        led: ledSensor,
        buzzer: buzzerSensor,
        touch: touchSensor
    }
};