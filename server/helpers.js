module.exports = {
    // Convert moisture sensor read in its equivalent range
    getMoistureRange: (moistureValue) => {
        if(moistureValue >= 0 && moistureValue < 300) {
            return 'Dry';
        } else if(moistureValue >= 300 && moistureValue < 600) {
            return 'Moist';
        } else {
            return 'Wet';
        }
    },

    // Convert air quality sensor read in its equivalent range
    getAirQualityRange: (airQualityValue) => {
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
    },

    // Convert gas sensor read in its equivalent range
    getGasRange: (gasValue) => {
        if(gasValue >= GAS_THRESHOLD) {
            return {
                gas: true,
                status: 'GAS DETECTED!'
            };
        } else {
            return {
                gas: false,
                status: 'No gas (OK)'
            };
        }
    },

    // Convert water sensor in its equivalent range
    getWaterRange: (waterValue) => {
        return (waterValue) ? 'Water needed' : 'Water enough';
    }
};