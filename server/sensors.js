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

// Convert moisture sensor read in its equivalent range
getMoistureRange = (moistureValue) => {
    if(moistureValue >= 0 && moistureValue < 300) {
        return 'Dry';
    } else if(moistureValue >= 300 && moistureValue < 600) {
        return 'Moist';
    } else {
        return 'Wet';
    }
}

// Convert air quality sensor read in its equivalent range
getAirQualityRange = (airQualityValue) => {
    if(airQualityValue >= 0 && airQualityValue < 50) {
        return 'Fresh air';
    } else if(airQualityValue >= 50 && airQualityValue < 200) {
        return 'Normal indoor air';
    } else if(airQualityValue >= 200 && airQualityValue < 400) {
        return 'Low pollution';
    } else if(airQualityValue >= 400 && airQualityValue < 600) {
        return 'High pollution';
    } else if(airQualityValue >= 600) {
        return 'Very high pollution';
    }
}

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
    currentValues: () => { return currentSensorValues; },
    monitor: (io) => {
        setInterval(function(){
            var now = new Date().getTime();
            currentSensorValues = {
                airQualityValue: airQualitySensor.read(),
                gasValue: gasSensor.getSample(),
                lightValue: lightSensor.value(),
                moistureValue: getMoistureRange(moistureSensor.value()),
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

            // Update the status of the platform
            platformStatus.temperature.push({x: now, y: currentSensorValues.tempValue});
            platformStatus.gas.push({x: now, y: currentSensorValues.gasValue});
            platformStatus.light.push({x: now, y: currentSensorValues.lightValue});

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

            io.sockets.emit('sensors:values', { 
                timestamp: now,
                temperature: {
                    value: currentSensorValues.tempValue
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
                water: {
                    value: currentSensorValues.waterValue
                },
                touch: {
                    state: currentSensorValues.touchValue
                }
            });
        }, 1000);
    }
};