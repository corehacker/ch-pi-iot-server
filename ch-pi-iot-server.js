const
ChEnv = require ('./src/ch-env.js');
const
ChHttpServer = require ('./src/ch-http-server.js');
const
ChUdpServer = require ('./src/ch-udp-server.js');
const
ChUdpClient = require ('./src/ch-udp-client.js');
const
ChMotionSensor = require ('./src/ch-motion-sensor.js');
const
ChLightSensor = require ('./src/ch-light-sensor.js');

function main () {
   var chEnv = new ChEnv ();

   var chHttpServer = new ChHttpServer (chEnv);
   chHttpServer.init ();
   chHttpServer.start ();

   var chUdpServer = new ChUdpServer (chEnv);
   chUdpServer.init ();
   chUdpServer.start ();

   var chUdpClient = new ChUdpClient (chEnv);
   chUdpClient.start ();

   var chMotionSensor = new ChMotionSensor (chEnv);
   chMotionSensor.init ();
   chMotionSensor.start ();

   var chLightSensor = new ChLightSensor (chEnv);
   chLightSensor.init ();
}

function main2 () {
   var Gpio = require('onoff').Gpio;
   var light = null;

   light = new Gpio(21, 'out');
   light.writeSync(0);

   setTimeout(function () {
    light = new Gpio (21, 'in', 'both');
    console.log ("Watching sensor...");
    light.watch(function(err, value) {
       if (err) {
          throw err;
        }
       console.log ("Light activity: " + value);
    });
   }, 100);
}

main ();
