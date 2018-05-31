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
    var options = {
      url: url,
      headers: {
        'User-Agent': 'https://github.com/robotnic/energyaustria',
        'Cookie':'ASP.NET_SessionId=aaks2lbml0ii31nqxisjybol'
      }
    }
    request(options, function(err, response, body){
      if (err) {
        console.log(err);
      } else {
        var start = body.indexOf('JSON.parse(\'') +12;
        var jsonString= body.substr(start);
        var end = jsonString.indexOf('}]\');') +2;
        var jsonString= jsonString.substr(0, end);
        try{
          cache[year] = JSON.parse(jsonString);
          q.resolve(cache[year]);
        }catch(e){
          q.reject(e);
        }
      }
    })
  };
  return q.promise;
}

