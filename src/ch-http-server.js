var log = null;
var Express = require('express');
var fs = require ('fs');

var ChHttpServer = function (env) {
   this.env = env;
   this.listenIP = null;
   this.listenPort = null;
   this.httpHandle = null;
   this.pathMapping = {};
   log = this.env.log;
};

ChHttpServer.prototype.getListenIP = function () {
   return "0.0.0.0";
};

ChHttpServer.prototype.getListenPort = function () {
   return 8080;
};

ChHttpServer.prototype.getMappings = function () {
   this.pathMapping = {
      "/config/?(/*)?": this.handleConfig,
      "/control": this.handleControl,
      "/www/?(/*(.js|.html|.htm|.css))?": this.handleStatic,
      "/services": this.handleServices,
      "/switch/on": this.handleSwitchControl,
      "/switch/off": this.handleSwitchControl
   }
};

ChHttpServer.prototype.handleSwitchControl = function (req, res) {
   log.trace ("Got request: " + req.url);
};

ChHttpServer.prototype.handleServices = function (req, res) {
};

ChHttpServer.prototype.handleStatic = function (req, res) {
   log.trace ("Got request: " + req.url);
   var path = req.url;
   if (req.url === "/www" || req.url === "/www/") {
      path = "/www/index.html";
   } else if (req.url === "/favicon.ico") {
      path = "/www/favicon.ico";
   }
   var options = {
      root: __dirname,
      dotfiles: 'deny'
   };
   log.trace ("Actual file path: " + path);
   log.trace ("options: " + JSON.stringify (options));
   res.sendFile(path, options, function (err) {
      if (err) {
         log.trace (err);
         res.status ("404").end ();
      }
      else {
         log.trace ("Sent: " + path);
      }
   });
};

ChHttpServer.prototype.handleControl = function (req, res) {
};

ChHttpServer.prototype.handleConfig = function (req, res) {
   log.trace ("Got request: " + req.url);
   log.trace ("Sending response...");

   fs.readFile ("./config/config.json", function (err, data) {
      if (err) {
         log.trace ("config file not found: " + err);
         res.send ("hello");
      }
      else {
         res.send (data);
      }
   });
};

ChHttpServer.prototype.setupCallbacks = function () {
   this.getMappings ();
   for (key in this.pathMapping) {
      log.trace ("Registering mapping: " + key);
      this.httpHandle.get(key, this.pathMapping[key]);
   }
   this.httpHandle.all('*', function(req, res) {
      throw new Error("Bad Request")
   });
   this.httpHandle.use(function(e, req, res, next) {
      if (e.message === "Bad Request") {
         res.status(400).json({error: {msg: e.message}});
      }
   });
}

ChHttpServer.prototype.init = function () {
   this.listenIP = this.getListenIP ();
   this.listenPort = this.getListenPort ();
   this.httpHandle = Express ();
   this.setupCallbacks ();
   return true;
};

ChHttpServer.prototype.start = function () {
   var self = this;
   this.httpHandle.listen(this.listenPort, this.listenIP,
         function () {
            log.trace ("HTTP server listening on " + self.listenIP + ":" + self.listenPort);
         });
}

module.exports = ChHttpServer;



