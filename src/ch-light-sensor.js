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

ChLightSensor.prototype.init = function () {
   var self = this;
   var sensors = this.getLightSensors ();
   var sensor = sensors [0];
   setInterval (function () {
      var detectlight = require ('child_process').spawn (
            '/usr/bin/detectlight', [sensor ["pin-number"]]);
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

module.exports = ChLightSensor;