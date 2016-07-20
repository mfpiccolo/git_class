var File = model('file');
var path = require('path');
var url = require('url');

module.exports = function notify(mode) {

  var modes = {
    image: function _notifyImage(req, res, next) {
      if (!req.body.url) {
        return res.json({ status: 'failed' });
      }

      var pathname = url.parse(req.body.url).pathname;
      var filename = path.basename(pathname, '.jpg');
      var uploadedAt = new Date(parseInt(filename.split('-').pop(), 16));

      File.forge({
        blue_number: req.blue_number,
        url: req.body.url,
        uploaded_at: uploadedAt
      }).save().then(function() {
        res.json({ status: 'ok' });
      });
    }
  };

  return modes[mode];
};
