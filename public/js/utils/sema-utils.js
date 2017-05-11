window.semaUtils = (function () {
    var utils = {};
    var ledCharacteristic = null;
    var remoteUrl = 'http://192.168.1.228:3001'; 

    /**
     * 
     */
    utils.log = (traceMessage, level) => {
        if(window.semaDebugMode) {
            switch(level) {
                case 'error':
                    console.error('[SIP] ' + traceMessage);
                    break;
                case 'info':
                    console.info('[SIP] ' + traceMessage);
                    break;
                case 'warn':
                    console.warn('[SIP] ' + traceMessage);
                    break;
                default:
                    console.log('[SIP] ' + traceMessage);
            }
        }
    };

    /**
     * 
     */
    utils.getSettings = (callback) => {
        $.ajax({
            url: '/api/settings',
            success: function(data) {
                callback(data);
            },
            cache: false
        });
    };

    /**
     * 
     */
    utils.requestSensorState = (sensor) => {
        var promise = new Promise((resolve, reject) => {
            $.ajax({
                url: '/api/' + sensor,
                success: (data) => {
                    resolve(data);
                },
                error: (err) => {
                    console.log(`Error requesting sensor ${sensor} failed: ${err}`);
                    reject(err);
                },
                cache: false
            });
        });
        return promise;
    };

    /**
     * 
     */
    utils.requestSensorData = (endpoint, chart, callback) => {
        utils.log('Calling to ' + endpoint);

        // "Sanitize" the input
        if(endpoint.charAt(0) === '/') {
            endpoint = endpoint.slice(1);
        }

        $.ajax({
            url: endpoint,
            success: function(data) {
                var series = chart.series[0],
                    shift = series.data.length > 20;

                // add the points
                for(let i=0; i<data.lastValues.length; i++) {
                    chart.series[0].addPoint(data.lastValues[i], true, shift);
                }

                callback();
            },
            cache: false
        });
    }; 

    /**
     * 
     */
    utils.sendX10Command = (device, action, callback) => {
        $.ajax({
            type: 'post',
            url: remoteUrl + '/x10',
            data: { 
                device: device, 
                action: action 
            },
            success: function() {
                callback();
            },
            cache: false
        });
    };

    /**
     * 
     */
    utils.getSongList = (callback) => {
        $.ajax({
            url: remoteUrl + '/library',
            success: function(data) {
                callback(data);
            },
            cache: false
        });
    };

    /**
     * 
     */
    utils.playSong = (song) => {
        $.ajax({
            type: 'post',
            data: { song: song },
            url: remoteUrl + '/library/play',
            success: function() { },
            error: function() { 
                // Check if there was an error (erro handler)
            },
            cache: false
        });
    };

    /**
     * 
     */
    utils.stopPlaying = () => {
        $.ajax({
            url: remoteUrl + '/library/stop',
            success: function(data) {
            },
            cache: false
        });
    };

    /**
     * 
     */
    utils.forwardPlaying = () => {
        $.ajax({
            url: remoteUrl + '/library/forward',
            success: function(data) {
            },
            cache: false
        });
    };

    /**
     * 
     */
    utils.connectToBulb = () => {
        if(navigator.bluetooth) {
            navigator.bluetooth.requestDevice({
                filters: [{ services: [0xffe5] }]
            })
            .then(function(device) {
                // Step 2: Connect to it
                console.log('setp2: ', device);
                return device.gatt.connect();
            })
            .then(function(server) {
                // Step 3: Get the Service
                console.log('setp3: ', server);
                return server.getPrimaryService(0xffe5);
            })
            .then(function(service) {
                // Step 4: get the Characteristic
                console.log('setp4: ', service);
                return service.getCharacteristic(0xffe9);
            })
            .then(function(characteristic) {
                // Step 5: Write to the characteristic
                console.log('setp5: ', characteristic);
                ledCharacteristic = characteristic;
                var data = new Uint8Array([0xbb, 0x25, 0x05, 0x44]);
                return characteristic.writeValue(data);
            })
            .catch(function(error) {
                // And of course: error handling!
                console.error('Connection failed! ', error);
            });
        } else {
            alert('Error, bluetooth not supported or disconnected');
        }
    };

    /**
     * 
     */
    utils.setBulbColor = (r, g, b) => {
        let data = new Uint8Array([0x56, r, g, b, 0x00, 0xf0, 0xaa]);
        return ledCharacteristic.writeValue(data)
            .catch(err => console.log('Error when writing value! ', err));
    };

    /**
     * 
     */
    utils.turnOn = () => {
        let data = new Uint8Array([0xcc, 0x23, 0x33]);
        return ledCharacteristic.writeValue(data)
            .then(() => {})
            .catch(err => console.log('Error when turning on! ', err));
    }

    /**
     * 
     */
    utils.turnOff = () => {
        let data = new Uint8Array([0xcc, 0x24, 0x33]);
        return ledCharacteristic.writeValue(data)
            .then(() => {})
            .catch(err => console.log('Error when turning off! ', err));
    }

    return utils;
}($));
