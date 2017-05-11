var mraa = require('mraa');
var groveSensors = require('jsupm_grove');
var groveMoisture = require('jsupm_grovemoisture');
var gasSensorLibrary = require('jsupm_gas');
var sensorRangeHelpers = require('./helpers');
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
    currentValues: () => { 
        return {
            airQualityValue: sensorRangeHelpers.getAirQualityRange(airQualitySensor.read()),
            gasValue: sensorRangeHelpers.getGasRange(gasSensor.getSample()),
            lightValue: lightSensor.value(),
            moistureValue: sensorRangeHelpers.getMoistureRange(moistureSensor.value()),
            tempValue: tempSensor.value(),
            touchValue: touchSensor.read(),
            waterValue: sensorRangeHelpers.getWaterRange(waterSensor.read())
        }; 
    },
    monitor: (io) => {
        setInterval(function(){
            var now = new Date().getTime();

            // Sampling sensors and updating current values
            currentSensorValues = {
                airQualityValue: airQualitySensor.read(),
                gasValue: gasSensor.getSample(),
                lightValue: lightSensor.value(),
                moistureValue: moistureSensor.value(),
                tempValue: tempSensor.value(),
                touchValue: touchSensor.read(),
                waterValue: !waterSensor.read()
            };
            console.log(`>> ` + 
                `A: ${currentSensorValues.airQualityValue}, ` +
                `G: ${currentSensorValues.gasValue}, ` +
                `L: ${currentSensorValues.lightValue}LUX, ` +
                `M: ${currentSensorValues.moistureValue}, ` +
                `T: ${currentSensorValues.tempValue}ºC, ` +
                `T2: ${currentSensorValues.touchValue}, ` +
                `W: ${currentSensorValues.waterValue}`);

            // Update the status of the platform (buffer values - history)
            platformStatus.airQuality.push({ x: now, y: currentSensorValues.airQualityValue });
            platformStatus.gas.push({ x: now, y: currentSensorValues.gasValue });
            platformStatus.light.push({ x: now, y: currentSensorValues.lightValue });
            platformStatus.moisture.push({ x: now, y: currentSensorValues.moistureValue });
            platformStatus.temperature.push({ x: now, y: currentSensorValues.tempValue });
            platformStatus.water.push({ x: now, y: currentSensorValues.moistureValue });

            // Check the alert for the panic mode
            if(currentSensorValues.gasValue > GAS_THRESHOLD && !panicMode) {
                panicMode = true;
                intervalPanicMode = setInterval(() => {
                console.log(' >>>> PANIC MODE ENABLED!!!! <<<<');
                buzzerSensor.write(buzzerState);
                buzzerState = (buzzerState === 0) ? 1 : 0;
                }, 200);
            } else if(currentSensorValues.gasValue <= GAS_THRESHOLD && panicMode) {
                clearInterval(intervalPanicMode);
                panicMode = false;
                buzzerSensor.write(0);
                console.log('>> Disabling panic mode... all it is OK now!');
            }

            // Send through the websocket the values recently sampled
            io.sockets.emit('sensors:values', { 
                timestamp: now,
                airQuality: {
                    value: currentSensorValues.airQualityValue,
                    range: sensorRangeHelpers.getAirQualityRange(currentSensorValues.airQualityValue)
                },
                gas: {
                    panicMode: panicMode,
                    value: currentSensorValues.gasValue
                },
                light: {
                    value: currentSensorValues.lightValue
                },
                moisture: {
                    value: currentSensorValues.moistureValue
                },
                temperature: {
                    value: currentSensorValues.tempValue
                },
                touch: {
                    state: currentSensorValues.touchValue
                },
                water: {
                    value: currentSensorValues.waterValue
                }
            });
        }, 1000);
    }
};