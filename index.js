var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var moment = require('moment');
var $q = require('q');
var app = express();

app.use('/', express.static(__dirname + '/public'));
app.use(bodyParser.json());

const { Pool, Client } = require('pg')

const pool = new Pool({
  user: 'energy',
  host: 'localhost',
  database: 'energy',
  password: 'energy',
  port: 5432,
})


app.post('/day', function (req, res) {
  var day = req.body.DateString;
  var pid = req.body.PID;
  var resolution = req.body.Resolution;
  var reload = req.query.reload;
  getChart(day, pid, resolution, reload).then(function(chart){
    res.send(chart);
  });
});

app.post('/week', function (req, res) {
  var day = req.body.DateString;
  var pid = req.body.PID;
  var resolution = '60M';
  var reload = req.query.reload;
  getDays(day, pid, resolution, reload, 7).then(function(response){
    res.send(response);
  });

})

app.post('/month', function (req, res) {
  var day = req.body.DateString;
  var pid = req.body.PID;
  var resolution = '60M';
  var reload = req.query.reload;
  getDays(day, pid, resolution, reload, 31).then(function(response){
    res.send(response);
  });

})




function getDays(day, pid, resolution, reload, days){
  var q=$q.defer();
  console.log('day', day);
  var d = moment(day,'YYYYMMDD');
  console.log('d',d);
  var all=[];
  for(var t = 0; t < days; t++) {
    var theDay =d.add(1,'day').format('YYYYMMDD')+'000000';
    console.log(theDay);
    all.push(getChart(theDay, pid, resolution, reload))
  }

  $q.all(all).then(function(results){
    var base = results[0];
    var values = [];
    results.forEach(function(result,i){
      if(i>0){
        var streams = result.d.ResponseData[1].DataStreams;
        var timestrings = result.d.ResponseData[1].Times;
        base.d.ResponseData[1].Times = base.d.ResponseData[1].Times.concat(timestrings);
        streams.forEach(function(stream,j){
          var values = result.d.ResponseData[1].DataStreams[j].ValueStrings;
          base.d.ResponseData[1].DataStreams[j].ValueStrings = base.d.ResponseData[1].DataStreams[j].ValueStrings.concat(values);
          console.log(2, base.d.ResponseData[1].DataStreams[j].ValueStrings.length);
        });
        
      }
//      base.d.ResponseData[1].DataStreams.ValueStrings.concat(value);
    });
    q.resolve(base);
  });
  return q.promise;
};



function getChart(day, pid, resolution, reload) {
  var q= $q.defer();
/*
  var day = req.body.DateString;
  var pid = req.body.PID;
  var resolution = req.body.Resolution;
*/
  var select = {
      text: 'select * from chart where day = $1 AND pid = $2 AND resolution = $3 LIMIT 1',
      values: [day, pid, resolution]
  }
  pool.query(select)
  .then(function(result) {
    if(result.rows[0] && !reload){
      q.resolve(result.rows[0].data);
    } else {
        var options = {
          method: 'POST',
          url: 'https://www.apg.at/transparency/WebMethods/ChartsEtc.aspx/GetChartData',
          headers: {
            'User-Agent': 'request'
          },
          json:{"PID":pid,"DateString":day,"Resolution":resolution,"Language":"de","AdditionalFilter":"B19|B16|B01|B04|B05|B06|B09|B10|B11|B12|B15|B17|B20|all"}
        }
        request(options, function (error, response, body) {
          q.resolve(body);
          const query = {
            text: 'INSERT INTO chart(day, data, pid, resolution) VALUES($1, $2, $3, $4)',
            values: [day, body, pid, resolution],
          }
          pool.query(query)
            .then(res => console.log(res.rows[0]))
            .catch(e => console.error(e.stack))
        });


    }
  })
  .catch(e => console.error(e.stack))
  return q.promise;
}


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
