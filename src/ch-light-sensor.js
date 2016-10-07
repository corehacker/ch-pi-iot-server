/**
 * http://usejsdoc.org/
 */

const GPIO_DIRECTION_IN  = 0;
const GPIO_DIRECTION_OUT = 1;

var fs = require ("fs");
var url = require ("url");
var http = require ("http");
var log = null;
var util = require ('./ch-utils.js');
var Epoll = require ('epoll').Epoll;

var ChLightSensor = function (env) {
   this.env = env;
   this.epollHandle = null;
   this.sensors = null;
   this.window = new Array ();
   this.WINDOW_LENGTH = 30;
   log = this.env.log;
};

ChLightSensor.prototype.writeValue = function (file, value) {
   log.trace ("Writing \"" + value + "\" into \"" + file + "\"");
   try {
      fs.writeFileSync (file, value);
   } catch (e) {
      log.trace ("Writing \"" + value + "\" into \"" + file + "\" failed: " + e);
   }
}

ChLightSensor.prototype.init = function () {
   var self = this;
   /*
   
   log.trace ("Initiating Epoll.");
   this.epollHandle = new Epoll (function (err, fd, events) {
      var buffer = new Buffer (1);
      fs.readSync (fd, buffer, 0, 1, 0);
      var activityType = (buffer.toString () === '1' ? 'active' : 'inactive');
      log.trace ("Light sensor: " + activityType + ", fd: " + fd);
   });
   log.trace ("Epoll sensing motion...");
   return true;
   */
   /*
   var sensors = this.getLightSensors();
   for (sensorIndex in sensors) {
      var sensor = sensors [sensorIndex];
      log.trace ("Sensor to monitor: " + sensor ["pin-number"]);
      this.setupSensor (sensor, GPIO_DIRECTION_OUT);

      var pinNumber = sensor ["pin-number"];
      var base = this.getGPIOFileBasepath ();
      pinNumber = "" + pinNumber + "";
      var valueFilepath = base + "/gpio" + pinNumber + "/value";
      this.writeValue (valueFilepath, "0");

      setTimeout(function () {
         log.trace ("Waited 100ms");
         self.setupSensor (sensor, GPIO_DIRECTION_IN);

         while (true) {
            var value = fs.readFileSync(valueFilepath);
            value = value.toString ().trim ();
            log.trace ("Reading: " + value);
            if (value === "1") {
               break;
            }
         }
         self.unsetupSensor (sensor);
      }, 100);
   }
   */
   setInterval (function () {
      var detectlight = require ('child_process').spawn (
            '/usr/bin/detectlight', []);
      var output = "";
      detectlight.stdout.on ('data', function (data) {
         var reading = parseInt (data.toString ().trim ());
         // log.trace ("Detect Light Reading: " + reading);
         if (self.window.length >= self.WINDOW_LENGTH) {
            self.window.shift ();
         }
         self.window.push (reading);
         // log.trace ("Window: " + self.window);
      });
      detectlight.on ('close', function (code) {
         // log.trace ("Detect light done: " + code);
      });
   }, 500);

   setInterval (function () {
      if (self.window.length >= self.WINDOW_LENGTH) {
         var average = self.window.average ();
         average = Math.floor (average)
         log.trace ("Average Reading: " + average);
      }

   }, 500);
};

ChLightSensor.prototype.getLightSensors = function () {
   var sensors = [];
   sensors.push ({
      "pin-number" : "21"
   });
   return sensors;
};

ChLightSensor.prototype.getGPIOFileBasepath = function () {
   return "/sys/class/gpio";
};

ChLightSensor.prototype.unsetupGPIOPin = function (pinNumber) {
   var base = this.getGPIOFileBasepath ();

   var unexportFilepath = base + "/unexport";
   pinNumber = "" + pinNumber + "";
   this.writeValue (unexportFilepath, pinNumber);
};

ChLightSensor.prototype.setupGPIOPinOut = function (pinNumber) {
   var base = this.getGPIOFileBasepath ();

   var exportFilepath = base + "/export";
   pinNumber = "" + pinNumber + "";
   this.writeValue (exportFilepath, pinNumber);

   var directionFilepath = base + "/gpio" + pinNumber + "/direction";
   var direction = "out";
   this.writeValue (directionFilepath, direction);
};

/*
 * echo 23 > /sys/class/gpio/export echo in > /sys/class/gpio/gpio23/direction
 * echo both > /sys/class/gpio/gpio23/edge
 */
ChLightSensor.prototype.setupGPIOPinIn = function (pinNumber) {
   var base = this.getGPIOFileBasepath ();

//   var exportFilepath = base + "/export";
//   pinNumber = "" + pinNumber + "";
//   this.writeValue (exportFilepath, pinNumber);

   var directionFilepath = base + "/gpio" + pinNumber + "/direction";
   var direction = "in";
   this.writeValue (directionFilepath, direction);

//   var edgeFilepath = base + "/gpio" + pinNumber + "/edge";
//   var edge = "both";
//   this.writeValue (edgeFilepath, edge);
};

ChLightSensor.prototype.setupSensor = function (sensor, direction) {
   var pinNumber = sensor ["pin-number"];
   if (direction === GPIO_DIRECTION_IN) {
      this.setupGPIOPinIn (pinNumber);
   }
   else {
      this.setupGPIOPinOut (pinNumber);
   }
};

ChLightSensor.prototype.unsetupSensor = function (sensor, direction) {
   var pinNumber = sensor ["pin-number"];
   this.unsetupGPIOPin (pinNumber);
};

ChLightSensor.prototype.monitorGPIOPin = function (pinNumber) {
   var base = this.getGPIOFileBasepath ();
   var buffer = new Buffer (1);
   pinNumber = "" + pinNumber + "";

   var valueFilepath = base + "/gpio" + pinNumber + "/value";

   log.trace ("Opening \"" + valueFilepath + "\" ...");
   try {
      var valueFd = fs.openSync (valueFilepath, 'r');
   } catch (e) {
      log.trace ("Opening \"" + valueFilepath + "\" failed:" + e);
   }

   log.trace ("Reading from \"" + valueFilepath + "\" ...");
   try {
      fs.readSync (valueFd, buffer, 0, 1, 0);
   } catch (e) {
      log.trace ("Reading from \"" + valueFilepath + "\" failed:" + e);
   }
   log.trace ("Adding \"" + valueFilepath + "\" to watch list");
   this.epollHandle.add (valueFd, Epoll.EPOLLPRI);
   return valueFd;
};

ChLightSensor.prototype.monitorSensor = function (sensor) {
   var pinNumber = sensor ["pin-number"];
   var id = this.monitorGPIOPin (pinNumber);
   sensor ["id"] = id;
};

ChLightSensor.prototype.start = function () {
   var self = this;
   var sensors = this.getLightSensors ();
   this.sensors = sensors;
   for (sensorIndex in sensors) {
      var sensor = sensors [sensorIndex];
      log.trace ("Sensor to monitor: " + sensor ["pin-number"]);
      this.setupSensor (sensor);
      this.monitorSensor (sensor);
   }
};

module.exports = ChLightSensor;