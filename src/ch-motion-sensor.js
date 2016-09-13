var fs = require ("fs");
var url = require ("url");
var http = require ("http");
var log = null;
var util = require ('./ch-utils.js');
var Epoll = require ('epoll').Epoll;

var ChMotionSensor = function (env) {
   this.env = env;
   this.epollHandle = null;
   this.sensors = null;
   log = this.env.log;
};

ChMotionSensor.prototype.init = function () {
   var self = this;
   log.trace ("Initiating Epoll.");
   this.epollHandle = new Epoll (function (err, fd, events) {
      var buffer = new Buffer (1);
      fs.readSync (fd, buffer, 0, 1, 0);
      var activityType = (buffer.toString () === '1' ? 'active' : 'inactive');
      log.trace ("Motion sensor: " + activityType + ", fd: " + fd);
      var sensor = self.determineActiveSensor (fd);
      log.trace ("Activity on sensor: " + JSON.stringify (sensor, null, " "));
      self.takeAppropriateActions (activityType, sensor);
   });
   log.trace ("Epoll sensing motion...");
   return true;
};

ChMotionSensor.prototype.determineActiveSensor = function (fd) {
   var sensor = null;
   for (sensorIndex in this.sensors) {
      sensor = this.sensors [sensorIndex];
      if (sensor ["id"] === fd) {
         break;
      }
   }
   return sensor;
};

ChMotionSensor.prototype.getActions = function (activityType, sensor) {
   var actions = [];
   switch (activityType) {
      case "active":
         actions.push ({
            "url" : "http://192.168.1.113:8080/switch/on",
            "protocol" : "GET"
         });
         break;
      case "inactive":
         /*
          * actions.push ({ "url": "http://192.168.1.113:8080/switch/off",
          * "protocol": "GET" });
          */
         break;
   }
   return actions;
};

ChMotionSensor.prototype.executeAction = function (action) {
   var req = http.get (action.url, function (res) {
      res.on ('data', function (chunk) {
      });
      res.on ('end', function () {
         log.trace ("response code: " + res.statusCode);
         if (200 === res.statusCode || "200" === res.statusCode) {
            log.trace ("Success taking action");
         } else {
            log.trace ("Error taking action");
         }
      });
   });
   req.on ('error', function (err) {
      log.trace ("Error taking action");
   });
   req.end ();
};

ChMotionSensor.prototype.takeAppropriateActions = function (activityType,
      sensor) {
   var actions = this.getActions (activityType, sensor);
   for (actionIndex in actions) {
      var action = actions [actionIndex];
      this.executeAction (action);
   }
};

ChMotionSensor.prototype.getMotionSensors = function () {
   var sensors = [];
   sensors.push ({
      "pin-number" : "23"
   });
   sensors.push ({
      "pin-number" : "18"
   });
   return sensors;
};

ChMotionSensor.prototype.getGPIOFileBasepath = function () {
   return "/sys/class/gpio";
};

/*
 * 
 * echo 23 > /sys/class/gpio/export echo in > /sys/class/gpio/gpio23/direction
 * echo both > /sys/class/gpio/gpio23/edge
 */
ChMotionSensor.prototype.setupGPIOPin = function (pinNumber) {
   var base = this.getGPIOFileBasepath ();

   var exportFilepath = base + "/export";
   pinNumber = "" + pinNumber + "";
   log.trace ("Writing \"" + pinNumber + "\" into \"" + exportFilepath + "\"");
   try {
      fs.writeFileSync (exportFilepath, pinNumber);
   } catch (e) {
      log.trace ("Writing \"" + pinNumber + "\" into \"" + exportFilepath
            + "\" failed: " + e);
   }

   var directionFilepath = base + "/gpio" + pinNumber + "/direction";
   var direction = "in";
   log.trace ("Writing \"" + direction + "\" into \"" + directionFilepath
         + "\"");
   try {
      fs.writeFileSync (directionFilepath, direction);
   } catch (e) {
      log.trace ("Writing \"" + direction + "\" into \"" + directionFilepath
            + "\" failed:" + e);
   }

   var edgeFilepath = base + "/gpio" + pinNumber + "/edge";
   var edge = "both";
   log.trace ("Writing \"" + edge + "\" into \"" + edgeFilepath + "\"");
   try {
      fs.writeFileSync (edgeFilepath, edge);
   } catch (e) {
      log.trace ("Writing \"" + edge + "\" into \"" + edgeFilepath
            + "\" failed:" + e);
   }
};

ChMotionSensor.prototype.setupSensor = function (sensor) {
   var pinNumber = sensor ["pin-number"];
   this.setupGPIOPin (pinNumber);
};

ChMotionSensor.prototype.monitorGPIOPin = function (pinNumber) {
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

ChMotionSensor.prototype.monitorSensor = function (sensor) {
   var pinNumber = sensor ["pin-number"];
   var id = this.monitorGPIOPin (pinNumber);
   sensor ["id"] = id;
};

ChMotionSensor.prototype.start = function () {
   var self = this;
   var sensors = this.getMotionSensors ();
   this.sensors = sensors;
   for (sensorIndex in sensors) {
      var sensor = sensors [sensorIndex];
      log.trace ("Sensor to monitor: " + sensor ["pin-number"]);
      this.setupSensor (sensor);
      this.monitorSensor (sensor);
   }
};

module.exports = ChMotionSensor;
