var mraa = require('mraa');
var sensors = require('jsupm_grove');
var gasSensorLibrary = require('jsupm_gas');
var GAS_THRESHOLD = 400;

// Analog sensors
var airQualitySensor;  // (A0)
var lightSensor = new sensors.GroveLight(1);
var tempSensor = new sensors.GroveTemp(2);
var rotarySensor = new sensors.GroveRotary(2);
var gasSensor = new gasSensorLibrary.MQ5(4);

// Digital sensors
var touchSensor = new mraa.Gpio(2);
var waterSensor;  // (D4)
var ledSensor = new sensors.GroveLed(5);
var buzzerSensor = new mraa.Gpio(6);

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
    },
    monitor: (io) => {
        setInterval(function(){
            var now = new Date().getTime();
            var tempValue = tempSensor.value();
            var gasValue = gasSensor.getSample();
            var lightValue = lightSensor.value();
            var rotValue = rotarySensor.abs_value();
            var touchValue = touchSensor.read();
            console.log(`>> T: ${tempValue}ºC, L: ${lightValue}LUX, R: ${rotValue}º, G: ${gasValue}, T2: ${touchValue}`);

            // Update the status of the platform
            platformStatus.temperature.push({x: now, y: tempValue});
            platformStatus.gas.push({x: now, y: gasValue});
            platformStatus.light.push({x: now, y: lightValue});

            // Check the alert for the panic mode
            if(gasValue > GAS_THRESHOLD && !panicMode) {
                panicMode = true;
                intervalPanicMode = setInterval(() => {
                console.log(' >>>> PANIC MODE ENABLED!!!! <<<<');
                buzzer.write(buzzerState);
                buzzerState = (buzzerState === 0) ? 1 : 0;
                }, 200);
            } else if(gasValue <= GAS_THRESHOLD && panicMode) {
                clearInterval(intervalPanicMode);
                panicMode = false;
                buzzer.write(0);
                console.log('>> Disabling panic mode... all it is OK now!');
            }

            io.sockets.emit('sensors:values', { 
                timestamp: now,
                temperature: {
                    value: tempValue
                },
                gas: {
                    panicMode: panicMode,
                    value: gasValue
                },
                light: {
                    value: lightValue
                },
                rotary: {
                    value: rotValue
                },
                touch: {
                    state: touchValue
                }
            });
        }, 1000);
    }
};