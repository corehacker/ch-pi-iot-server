var log = null;
var dgram = require('dgram');
var os = require('os');
var util = require ('./ch-utils.js');
var message = new Buffer('discover');

var ChUdpClient = function (env) {
   this.env = env;
   this.udpHandle = null;
   this.udpTimer = null;
   this.broadcastAddress = null;
   this.machineList = [];
   log = this.env.log;
};

ChUdpClient.prototype.getIntervalMs = function () {
   return 5000;
};

ChUdpClient.prototype.getTimeoutMs = function () {
   return 1000;
};

ChUdpClient.prototype.getBroadcastAddress = function () {
   var nI = os.networkInterfaces();
   // log.trace ("Interfaces: " + JSON.stringify (nI, null, " "));
   return "255.255.255.255";
};

ChUdpClient.prototype.getBroadcastPort = function () {
   return 8080;
};


ChUdpClient.prototype.validateMessage = function (message) {
   var valid = false;
   /*
    * Valid message JSON:
    *    {"config":{"http":{"ip":"192.168.1.101","port":8080,"url":"/services"}}}
    */
   if (message && message.hasOwnProperty ("config")) {
      var config = message.config;
      if (config && config.hasOwnProperty ("http")) {
         var http = config.http;
         if (http && http.hasOwnProperty ("ip") &&
            http.hasOwnProperty ("port") && http.hasOwnProperty ("url") &&
            http.ip && http.port && http.url &&
            http.ip.length > 0 && http.url.length > 0) {
            valid = true;
         }
      }
   }
   return valid;
};

ChUdpClient.prototype.getMachineDetailsFromMessage = function (message) {
   var machineDetails = null;
   if (this.validateMessage (message)) {
     machineDetails = {};
     machineDetails ["active"] = true;
     machineDetails ["http"] = message.config.http;
   } else {
      log.trace ("Invalid message from machine. Ignoring it.");
   }
   return machineDetails;
};

ChUdpClient.prototype.sendBroadcast = function (self) {
   self.udpHandle = dgram.createSocket ('udp4');
   self.udpHandle.bind (function () {
      //log.trace ("UDP client socket bind complete.");
      self.udpHandle.setBroadcast (true);
      //log.trace ("UDP client socket set to broadcast.")
      self.broadcastAddress = self.getBroadcastAddress ();

      self.udpHandle.send(message, 0, message.length, self.getBroadcastPort (),
         self.broadcastAddress, function(err, bytes) {
         if (err) throw err;
         //log.trace ('UDP message sent to ' + self.broadcastAddress +':'+
         //   self.getBroadcastPort ());
         setTimeout (function () {
            self.udpHandle.close ();
         }, self.getTimeoutMs (), self);
      });

      self.udpHandle.on("message", function (message, remote) {
         message = message.toString ();
         //log.trace("UDP message from: " + remote.address + ":" + remote.port +
         //   ". Message: \"" + message + "\"");
         try {
            var messageJson = JSON.parse (message);
            var machineDetails = self.getMachineDetailsFromMessage (messageJson);
            if (machineDetails) {
               //log.trace ("Valid machine: " +
               //   JSON.stringify (machineDetails, null, " "));
               self.machineList.push (machineDetails);
            }
         }
         catch (e) {
            //log.trace ("Response not JSON. Ignoring it.");
         }
      });
   });


   self.udpTimer = setTimeout (self.sendBroadcast, self.getIntervalMs (), self);
};

ChUdpClient.prototype.start = function () {
   var self = this;
   this.udpTimer = setTimeout (this.sendBroadcast, 0, this);
};

ChUdpClient.prototype.getMachineList = function () {
   return this.machineList;
};

ChUdpClient.prototype.stop = function () {
   if (this.udpTimer) {
      clearTimeout (this.udpTimer);
   }
};

module.exports = ChUdpClient;
