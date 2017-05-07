var express = require('express');
var app = express();
var cors = require('cors');
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

// Static folder configuration
app.use(express.static(__dirname + '/public'));  
app.use('/js', express.static(__dirname + '/public')); 
app.use('/css', express.static(__dirname + '/public')); 
app.get('/', (req, res) => {
  res.sendFile('public/index.html');
});

// CORS configuration
app.use(cors());

// Express routes
app.use('/api', require('./server/routes')); 

/**
 * 
 */
io.set('origins', '*:*');

/**
 * 
 */
io.on('connection', (clientSocket) => {  
    console.log('Client connected... ' + clientSocket.id);

    clientSocket.on('event:client', (message) => {
      console.log('Message received: ', message);
      clientSocket.emit('msg', { resp: 'user logged successfully' });
    });

    clientSocket.on('event:sensor', (actionData) => {
      console.log('Registered action: ', JSON.stringify(actionData));
      switch(actionData.sensor) {
        case 'switcher':
          if(actionData.action === 'on') {
            led.on();
            ledState = 'on';
            io.sockets.emit('event:sensor', { 
              sensor: 'switcher',
              value: ledState
            });
          } else {
            led.off();
            ledState = 'off';
            io.sockets.emit('event:sensor', { 
              sensor: 'switcher',
              value: ledState
            });
          }
          break;
      }
    });
});

/**
 * La que envía el dato actualizado
 */
/*setInterval(function(){
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
}, 1000); // Parametrizar este valor
*/

function getRandomValue(max, min) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

server.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
