/**
 * http://usejsdoc.org/
 */
var fs = require ("fs");
var log = null;
var util = require ('./ch-utils.js');

var ChGPIO = function (env, pin, direction) {
   this.pin = pin;
   this.direction = direction;

   log = this.env.log;
};

ChGPIO.prototype.getFileBasepath = function () {
   return "/sys/class/gpio";
};

ChGPIO.prototype.setup = function () {
   var base = this.getFileBasepath ();

   var exportFilepath = base + "/export";
   log.trace ("Writing \"" + this.pin + "\" into \"" + exportFilepath + "\"");
   try {
      fs.writeFileSync (exportFilepath, this.pin);
   } catch (e) {
      log.trace ("Writing \"" + this.pin + "\" into \"" + exportFilepath
            + "\" failed: " + e);
   }

   var directionFilepath = base + "/gpio" + this.pin + "/direction";
   var direction = "in";
   log.trace ("Writing \"" + direction + "\" into \"" + directionFilepath
         + "\"");
   try {
      fs.writeFileSync (directionFilepath, direction);
   } catch (e) {
      log.trace ("Writing \"" + direction + "\" into \"" + directionFilepath
            + "\" failed:" + e);
   }

   var edgeFilepath = base + "/gpio" + this.pin + "/edge";
   var edge = "both";
   log.trace ("Writing \"" + edge + "\" into \"" + edgeFilepath + "\"");
   try {
      fs.writeFileSync (edgeFilepath, edge);
   } catch (e) {
      log.trace ("Writing \"" + edge + "\" into \"" + edgeFilepath
            + "\" failed:" + e);
   }
};

ChGPIO.prototype.getPin = function () {
   return this.pin;
};

module.exports = ChGPIO;
