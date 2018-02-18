var request = require('request');
var Q = require('q');

module.exports = {
  load: function(year, reload){
    return load(year, reload);
  }
}

var cache = null;

function load(year, reload){
  var q = Q.defer();
  if(cache && ! reload){
    q.resolve(cache);
  } else {
    var url = "https://www.apg.at/transparency/IGCA/TableAndChart.aspx?Year=" + year;
    request(url, function(err, response, body){
      if (err) {

      } else {
        var start = body.indexOf('JSON.parse(\'') +12;
        var jsonString= body.substr(start);
        var end = jsonString.indexOf('}]\');') +2;
        var jsonString= jsonString.substr(0, end);
        cache = JSON.parse(jsonString);
        q.resolve(cache);
      }
    })
  };
  return q.promise;
}

