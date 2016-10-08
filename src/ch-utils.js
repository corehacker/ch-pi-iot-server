var os = require ('os');

module.exports = {
   getIpAddresses : function () {
      var ips = [];
      var ifaces = os.networkInterfaces ();

      for (i in ifaces) {
         var ifname = ifaces [i];
         for (j in ifname) {
            var iface = ifname [j];
            if ("IPv4" === iface.family && false === iface.internal
                  && iface.address.startsWith ("192.168.")
                  && iface.netmask.startsWith ("255.255.255.")) {
               ips.push (iface);
            }
         }
      }
      return ips;
   }
};

Array.prototype.sum = function () {
   var sum = 0;
   for (var i = 0; i < this.length; i++) {
      sum += this [i];
   }
   return sum;
};

Array.prototype.average = function () {
   var sum = this.sum ();
   return ((this.length > 0) ? (sum / this.length) : 0);
};
