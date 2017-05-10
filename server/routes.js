var express = require('express');
var router = express.Router();
var sensors = require('./sensors');
var tickEventStream = 1000;
var interval = null;

router.get('/settings', (req, res) => {
  res.send([
    { key: 'frequency', name: 'Sampling frequency', value: 'xxx' },
    { key: 'numberOfPoints', name: 'Number of points', value: 'yyy' },
    { key: 'k1', name: 'n1', value: 'v1' },
    { key: 'k2', name: 'n2', value: 'v2' }
  ]);
});

router.get('/temp', (req, res) => {
  res.send({
    sensor: 'temperature',
    lastValues: sensors.platformStatus.temperature.slice(-20)
  });
});

router.get('/gas', (req, res) => {
  res.send({
    sensor: 'gas',
    lastValues: sensors.platformStatus.gas.slice(-20)
  });
});

router.get('/light', (req, res) => {
  res.send({
    sensor: 'light',
    lastValues: sensors.platformStatus.light.slice(-20)
  });
});

router.get('/air-quality', (req, res) => {
  res.send({
    sensor: 'airQuality',
    lastValues: sensors.platformStatus.airQuality.slice(-20)
  });
});

router.get('/moisture', (req, res) => {
  res.send({
    sensor: 'moisture',
    lastValues: sensors.platformStatus.moisture.slice(-20)
  });
});

router.get('/music', (req, res) => {
  res.send({
    sensor: 'music',
    currentStatus: {
      isPlaying: false,
      song: ''
    }
  });
});

router.get('/sensor/led', (req, res) => {
  res.send({
    sensor: 'led',
    state: 'off'
  });
});

router.get('/http-stream', (req, res) => {
    // Handler for client-side disconnect 
    req.on('close', () => { 
        console.log('Client disconnected from the stream!'); 
        clearInterval(interval);
        res.end();
    });

    // Send these headers
    res.writeHead(200, { 
        'Content-Type': 'text/event-stream',
        'Cache-control': 'no-cache',
        'Connection': 'keep-alive' 
    });

    // Send numIterations of chunk data in stream way (only one request made)
    interval = setInterval(() => {
        res.write(JSON.stringify({
            sensors: require('./sensors').currentValues()
        }));
    }, tickEventStream);

});

module.exports = router;