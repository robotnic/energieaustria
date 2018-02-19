var request = require('request');
var Q = require('q');

module.exports = {
  load: function(year, reload){
    return load(year, reload);
  }
}

var cache = {};

function load(year, reload){
  var q = Q.defer();
  if(cache[year] && !reload){
    q.resolve(cache[year]);
  } else {
    var url = "https://www.apg.at/transparency/IGCA/TableAndChart.aspx?Year=" + year;
    console.log(url);
    request(url, function(err, response, body){
      if (err) {

      } else {
        var start = body.indexOf('JSON.parse(\'') +12;
        var jsonString= body.substr(start);
        var end = jsonString.indexOf('}]\');') +2;
        var jsonString= jsonString.substr(0, end);
        cache[year] = JSON.parse(jsonString);
        q.resolve(cache[year]);
      }
    })
  };
  return q.promise;
}

