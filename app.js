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
var x = require('./server/sensors');
x.monitor(io);

function getRandomValue(max, min) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

server.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
