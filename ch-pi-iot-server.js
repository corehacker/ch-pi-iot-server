
const ChEnv = require ('./src/ch-env.js');
const ChHttpServer = require ('./src/ch-http-server.js');
const ChUdpServer = require ('./src/ch-udp-server.js');
const ChUdpClient = require ('./src/ch-udp-client.js');
const ChMotionSensor = require ('./src/ch-motion-sensor.js');

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
}

main ();

