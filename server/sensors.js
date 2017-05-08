var mraa = require('mraa');
var groveSensors = require('jsupm_grove');
var groveMoisture = require('jsupm_grovemoisture');
var gasSensorLibrary = require('jsupm_gas');
var GAS_THRESHOLD = 400;
var currentSensorValues = {};

// Sensors
var platformStatus = {
    temperature: [],
    gas: [],
    light: [],
    moisture: [],
    water: [],
    airQuality: [],
    music: []
};

// Analog sensors
var airQualitySensor = new mraa.Aio(0);
var lightSensor = new groveSensors.GroveLight(1);
var tempSensor = new groveSensors.GroveTemp(2);
var moistureSensor = new groveMoisture.GroveMoisture(3);
var gasSensor = new gasSensorLibrary.MQ5(4);

// Digital sensors
var touchSensor = new mraa.Gpio(2);
var waterSensor = new mraa.Gpio(4);  
var ledSensor = new groveSensors.GroveLed(5);
var buzzerSensor = new mraa.Gpio(6);

// Configure GPIO direction
touchSensor.dir(mraa.DIR_IN);
waterSensor.dir(mraa.DIR_IN);
buzzerSensor.dir(mraa.DIR_OUT);

//
var buzzerState = 0;
var panicMode = false;
var intervalPanicMode;
var ledState = 'off';

// Initialize sensors
buzzerSensor.write(0);
ledSensor.off();

module.exports = {
    platformStatus: platformStatus,
    sensors: {
        airQuality: airQualitySensor,
        buzzer: buzzerSensor,
        gas: gasSensor,
        led: ledSensor,
        light: lightSensor,
        moisture: moistureSensor,
        temperature: tempSensor,
        touch: touchSensor,
        water: waterSensor
    },
    currentValues: currentSensorValues,
    monitor: (io) => {
        setInterval(function(){
            let now = new Date().getTime();
            currentSensorValues = {
                airQualityValue: airQualitySensor.read(),
                gasValue: gasSensor.getSample(),
                lightValue: lightSensor.value(),
                moistureValue: moistureSensor.value(),
                tempValue: tempSensor.value(),
                touchValue: touchSensor.read(),
                waterValue: (waterSensor.read() === 1) ? false : true
            };
            console.log(`>> ` + 
                `A: ${currentSensorValues.airQualityValue}, ` +
                `G: ${currentSensorValues.gasValue}, ` +
                `L: ${currentSensorValues.lightValue}LUX, ` +
                `M: ${currentSensorValues.moistureValue}, ` +
                `T: ${currentSensorValues.tempValue}ºC, ` +
                `T2: ${currentSensorValues.touchValue}, ` +
                `W: ${currentSensorValues.waterValue}`);

            // Update the status of the platform
            platformStatus.temperature.push({x: now, y: tempValue});
            platformStatus.gas.push({x: now, y: gasValue});
            platformStatus.light.push({x: now, y: lightValue});

            // Check the alert for the panic mode
            if(gasValue > GAS_THRESHOLD && !panicMode) {
                panicMode = true;
                intervalPanicMode = setInterval(() => {
                console.log(' >>>> PANIC MODE ENABLED!!!! <<<<');
                buzzerSensor.write(buzzerState);
                buzzerState = (buzzerState === 0) ? 1 : 0;
                }, 200);
            } else if(gasValue <= GAS_THRESHOLD && panicMode) {
                clearInterval(intervalPanicMode);
                panicMode = false;
                buzzerSensor.write(0);
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
                moisture: {
                    value: moistureValue
                },
                water: {
                    value: waterValue
                },
                touch: {
                    state: touchValue
                }
            });
        }, 1000);
    }
};