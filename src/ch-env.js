const
CONFIG_FILENAME = "/etc/ch-iot.conf";
const
ChLog = require ('./ch-log.js');

var ChEnv = function () {
   this.cfg = null;
   this.log = null;
   try {
      this.cfg = require (CONFIG_FILENAME);
   } catch (e) {

   }

   this.log = new ChLog ();
};

module.exports = ChEnv;
