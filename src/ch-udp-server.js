var log = null;
var dgram = require('dgram');
var http = require('http');
var util = require ('./ch-utils.js');

var ChUdpServer = function (env) {
   this.env = env;
   this.listenIP = null;
   this.listenPort = null;
   this.udpHandle = null;
   log = this.env.log;
};

ChUdpServer.prototype.getListenIP = function () {
   return "0.0.0.0";
};

ChUdpServer.prototype.getListenPort = function () {
   return 8080;
};

ChUdpServer.prototype.getHttpListenPort = function () {
   return 8080;
};

ChUdpServer.prototype.getDiscoverResponse = function () {
   var config = {
      config: {
         http: {
            ip: null,
            port: this.getHttpListenPort (),
            url: "/services"
         }
      }
   }
   var ips = util.getIpAddresses();
   if (ips.length > 0 && ips[0].address.length >= 7) {
      config.config.http.ip = ips[0].address;
   } else {
      config.config.http.ip = "127.0.0.1";
   }
   // log.trace ("UDP discover response string: " + JSON.stringify (config));
   return JSON.stringify (config);
};

ChUdpServer.prototype.sendUdpResponse = function (message, remote) {
   var resPort = remote.port;
   var resIp = remote.address;
   var messageStr = message;
   var messageBuf = new Buffer(messageStr);

   var client = dgram.createSocket('udp4');
   client.send(messageBuf, 0, messageBuf.length, resPort, resIp, function(err, bytes) {
      if (err) {
         log.trace ('Error: UDP message sent to ' + resIp +':'+ resPort);
      } else {
         // log.trace ('Success: UDP message sent to ' + resIp +':'+ resPort);
      }
      client.close();
   });
};

ChUdpServer.prototype.handleDiscover = function (message, remote) {
   this.sendUdpResponse (this.getDiscoverResponse (), remote);
};

ChUdpServer.prototype.getSwitchOnActions = function () {
   var actions = [];
   actions.push ({
      "url": "http://127.0.0.1:8080/switch/on",
      "protocol": "GET"
   });
   return actions;
};

ChUdpServer.prototype.getSwitchOffActions = function () {
   var actions = [];
   actions.push ({
      url: "http://127.0.0.1:8080/switch/off",
      protocol: "GET"
   });
   return actions;
};

ChUdpServer.prototype.executeAction = function (response, action, remote) {
   var self = this;
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
         self.sendUdpResponse (response, remote);
      });
   });
   req.on ('error', function (err) {
      log.trace ("Error taking action");
   });
   req.end ();
};

ChUdpServer.prototype.handleSwitchOn = function (message, remote) {
   log.trace("UDP message from: " + remote.address + ":" + remote.port + ". Message: \"" + message + "\"");
   var actions = this.getSwitchOnActions ();
   var response = "on";
   for (actionIndex in actions) {
      var action = actions [actionIndex];
      this.executeAction (response, action, remote);
   }
};

ChUdpServer.prototype.handleSwitchOff = function (message, remote) {
   log.trace("UDP message from: " + remote.address + ":" + remote.port + ". Message: \"" + message + "\"");
   var actions = this.getSwitchOffActions ();
   var response = "off";
   for (actionIndex in actions) {
      var action = actions [actionIndex];
      this.executeAction (response, action, remote);
   }
};

ChUdpServer.prototype.setupCallbacks = function () {
   var self = this;
   this.udpHandle.on('listening', function () {
      var address = self.udpHandle.address();
      log.trace('UDP Server listening on ' + address.address + ":" + address.port);
   });

   this.udpHandle.on('message', function (message, remote) {
      message = message.toString ();
      // log.trace("UDP message from: " + remote.address + ":" + remote.port + ". Message: \"" + message + "\"");
      switch (message) {
         case "discover":
            self.handleDiscover (message, remote);
            break;
         case "on":
            self.handleSwitchOn (message, remote);
            break;
         case "off":
            self.handleSwitchOff (message, remote);
            break;
      }
   });
}

ChUdpServer.prototype.init = function () {
   this.listenIP = this.getListenIP ();
   this.listenPort = this.getListenPort ();
   this.udpHandle = dgram.createSocket('udp4');
   this.setupCallbacks ();
   return true;
};

ChUdpServer.prototype.start = function () {
   var self = this;
   this.udpHandle.bind (this.listenPort, this.listenIP);
}

module.exports = ChUdpServer;



