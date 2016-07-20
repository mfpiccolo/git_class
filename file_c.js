var Zipcode = model('zipcode');

module.exports = function info(mode) {
  var routes = {
    zipcode: function zipcode(req, res, next) {
      Zipcode.where({ zip: req.params.zipcode }).fetch().then(function(row) {
        res.json({
          status: row ? 'ok' : 'failed',
          zipcode: row || {}
        });
      });
    },
    vin: function vin(req, res, next) {
      res.send('not yet');
    }
  };

  return routes[mode] || function(req, res, next) {
    next();
  };
};
