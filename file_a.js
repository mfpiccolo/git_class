const path = require('path');
const couponCode = require('coupon-code');
const runAsync = require('../lib/run-async');
const modelHelper = require('../lib/models');

const Customer = model('customer');
const Vehicle = model('vehicle');
const Entry = model('entry');
const Event = model('event');
const Location = model('location');

module.exports = function smog(mode) {
  var routes = {
    index: function(req, res, next) {
      var query_string = req.query.query_string;
      runAsync(function *getQueriedEntries() {
        var cur_event = yield modelHelper.getCurrentEvent(req, res);
        var entries = yield modelHelper.queryEntries(req, res, cur_event);
        res.render('smog/index', {
          entries: entries.models,
          query_string: req.query.query_string
        });
      });
    },
    edit: function(req, res, next) {
      if (!req.entry) {
        return res.status(404).send('not found');
      }
      var entry = req.entry.toJSON();
      res.render('smog/edit', {
        blue_uid: req.blue_uid,
        entry: entry
      });
    },
    update: function(req, res, next) {
      var entry = req.body.entry;
      if (entry.qualifies_voucher === undefined) req.body.entry.qualifies_voucher = false;
      if (entry.check_engine === undefined) req.body.entry.check_engine = false;
      if (entry.is_smoking === undefined) req.body.entry.is_smoking = false;
      if (entry.is_smogged === undefined) req.body.entry.is_smogged = false;
      runAsync(function *checkAddVoucher() {
        if (entry.qualifies_voucher || entry.is_smoking) {
          req.body.entry.voucher_number = yield generateUniqueCode();
        }
        Entry.update(req.body.entry, { id: req.body.entry.id })
          .then(function() {
            res.redirect('/smog');
          }).catch(function(err) {
            console.log(err);
            res.json({ status: 'failed' });
          });
      });
    }
  }

  return routes[mode] || function (req, res, next) {
    return next();
  };
};

function checkCode(code) {
  return new Promise(function(resolve, reject) {
    runAsync(function *getEntryCode() {
      var entry = yield Entry.where({voucher_number: code}).fetch({require: false});
      if (entry) {
        debug('smog', `${code} is not unique and neither are you`);
        resolve(false);
      } else {
        debug('smog', `${code} is unique`);
        resolve(true);
      }
    });
  });
}

var generateUniqueCode = function() {
  return new Promise(function(resolve, reject) {
    var code = couponCode.generate({ partLen: 4, parts: 5});
    return checkCode(code).then(function(result) {
      if (result) {
        resolve(code);
      } else {
        resolve(generateUniqueCode())
      }
    });
  });
}
