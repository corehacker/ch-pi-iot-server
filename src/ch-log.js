const
callerId = require ('caller-id');
const
path = require ('path');

var ChLog = function () {

};

ChLog.prototype.trace = function (string) {
   var caller = callerId.getData ();
   var filename = path.basename (caller.filePath);
   var line = caller.lineNumber;
   var backtrace = filename + ":" + line;
   console.log ((new Date ().getTime ()) + " | " + backtrace + " | T | "
         + string);
};

module.exports = ChLog;
