var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var moment = require('moment');
var $q = require('q');
var app = express();
var fs = require('fs');
var dbconnect = JSON.parse(fs.readFileSync('config/dbconnect.json', 'utf8'));
var swaggerTemplate = fs.readFileSync('config/swaggertemplate.json', 'utf8');

console.log(dbconnect);
var XLSX = require('xlsx');


app.use('/', express.static(__dirname + '/public'));
app.use(bodyParser.json());

const {
  Pool,
  Client
} = require('pg')

const pool = new Pool(dbconnect);

app.post('/day', function(req, res) {
  var day = req.body.DateString;
  var pid = req.body.PID;
  var resolution = req.body.Resolution;
  var reload = req.query.reload;
  getChart(day, pid, resolution, reload).then(function(chart) {
    res.send(chart);
  });
});

app.post('/week', function(req, res) {
  var day = req.body.DateString;
  var pid = req.body.PID;
  var resolution = '60M';
  var reload = req.query.reload;
  getDays(day, pid, resolution, reload, 7).then(function(response) {
    res.send(response);
  });

})

app.post('/month', function(req, res) {
  var day = req.body.DateString;
  var pid = req.body.PID;
  var resolution = '60M';
  var reload = req.query.reload;
  getDays(day, pid, resolution, reload, 31).then(function(response) {
    res.send(response);
  });

})


app.get('/energy', function(req, res) {
  var day = req.body.DateString;
  var pid = req.body.PID;
  var resolution = '60M';
  var reload = req.query.reload;
  getEnergy(day, pid, resolution, reload, 31).then(function(response) {
    res.send(response);
  });


});


app.get('/statistics', function(req, res) {
  loadStatistics().then(function(responses) {
    console.log(responses);
    res.send(responses);
  }, function(error) {
    console.log(error);
  });

});
app.get('/sectors', function(req, res) {
  var sectors = [];
  for (var s in statistics) {
    sectors.push(s);
  }
  res.send(sectors);
});
app.get('/sectors/:sector', function(req, res) {
  console.log(req.params.sector);
  var stat = statistics[req.params.sector];
  if (req.params.sector === 'Tabelle1') {
    var selected = parseTabelle1(stat);
  } else {
    var selected = select(stat, '30', '36');
  }
  res.send(selected);
});

app.get('/sectors/:sector/:year', function(req, res) {
  console.log('yea', req.params);
  var result = {};
  var stat = statistics[req.params.sector];
  var selected = select(stat, '30', '36');
  for (var s in selected) {
    console.log(s);
    result[s] = selected[s][req.params.year];
  }
  if (req.params.sector === 'Tabelle1') {
    result = parseTabelle1(stat)[req.params.year];
    delete result['Insgesamt'];
  }
  res.send(result);
});

//display path in swagger, not datamodel jet
app.get('/openapi', function(req, res) {
  var swagger = JSON.parse(swaggerTemplate);
  app._router.stack.forEach(function(layer){
  if(layer.route){
    swagger.paths[layer.route.path] = {};
    for(var m in layer.route.methods){
      swagger.paths[layer.route.path][m]={};
      console.log(m, layer.route.path);
    }
  }
  });
  res.send(swagger);
});


//move part below to seperate file

function parseTabelle1(stat) {
  var ret = {};
  var title = 'nix';
  var titleArray = [];
  for (var s in stat) {
    var sx = parseInt(s.substring(1));
    if (sx === 2) {
      firstLine = stat[s];
      console.log('firstLine', firstLine.v);
      title = firstLine.v
      if (title) {
        console.log(title);
        title = (title + '').replace(/[\n\r\t-]/g, '');
      }
      titleArray.push(title);
      ret[title] = {};
    } else {
      if (s[0] === 'A') {
        title = stat[s].v;
        console.log('s', s[0], title);
      } else {
        var char = s[0].charCodeAt(0) - 65;

        console.log('else', s[0], char, title, titleArray[char], stat[s].v);
        var subTitle = titleArray[char];
        if (ret[subTitle]) {
          ret[subTitle][title] = stat[s].v;
        }
      }
    }

  }
  return ret;
}

function select(stat, a, b) {
  var result = {}
  var xAxis = getYears(stat);
  console.log(xAxis);
  var r = getItems(stat, a, b, xAxis);
  console.log(r);
  /*
  for (var s in stat) {
    if (comp(a, s, b)) {
        console.log(s);
        if (!result[stat[s].v]) {
            console.log(s,stat[s]);
            result[stat[s].v] = stat[s];
        } else {
            //console.log('else', stat[s]);
        }
    };
  }
  */
  return r;
}

function getItems(stat, a, b, xAxis) {
  console.log(a, b, l);
  var l = xAxis.length;
  var rows = {};
  var title = "nix";

  for (var s in stat) {
    //    console.log(s);
    var c = s[0];
    var sx = parseInt(s.substring(1));
    if (sx && a <= sx && sx <= b) {
      console.log(s, c, sx);
      if (c === 'A') {
        console.log(stat[s].v);
        title = stat[s].v;
        rows[title] = {};
      } else {
        var ja = c.charCodeAt(0) - 65;
        var year = xAxis[ja];

        //        console.log(s,stat[s]);
        rows[title][year] = stat[s].v
      }
    }
  }
  return rows;
}

function comp(a, s, b) {
  s = s.substring(1);

  var r = (a <= s && s <= b);
  return r;
}

function getYears(stat) {
  var years = [];
  for (var s in stat) {
    var sx = s.substring(1);
    if (sx === '2') { //secons row
      years.push(stat[s].v);
    }
  }
  //  years.shift();
  return years;
}


var statistics = null;
loadStatistics();

function loadStatistics() {
  var result = {}
  var q = $q.defer();
  var excels = [
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=115546',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022710',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022712',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022713',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022716',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022718',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022719'
  ]

  var resolveCount = 0;
  var promises = [];
  excels.forEach(function(excel, e) {
    promises.push(loadFile(excel, e));
  });
  $q.all(promises).then(function(result) {
    //    console.log(result);
    statistics = parseExcel(result);
    q.resolve(statistics);
  }, function(error) {
    q.reject(error);
  })
  return q.promise;
};

function loadFile(excel) {
  var q = $q.defer();
  request.get(excel, {
    encoding: null
  }, function(error, response, body) {
    if (error) {
      console.log(error);
      q.reject(error);
    } else {
      var workbook = XLSX.read(body, {
        type: 'buffer'
      });
      //console.log(JSON.stringify(workbook, null, 2));
      q.resolve(workbook);
    }
  });

  return q.promise;
}

function parseExcel(results) {
  var response = {}
  results.forEach(function(result) {
    for (var s in result.Sheets) {
      console.log(s);
      response[s] = result.Sheets[s];
    };
  });
  return response;
}

function loadExcels() {
  var result = {}
  var q = $q.defer();
  var excels = [
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=115546',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022710',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022712',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022713',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022716',
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022718'
  ]

  var resolveCount = 0;
  excels.forEach(function(excel, e) {
    request.get(excel, {
      encoding: null
    }, function(error, response, body) {
      if (error) {
        console.log(error);
      } else {
        var workbook = XLSX.read(body, {
          type: 'buffer'
        });
        //console.log(JSON.stringify(workbook, null, 2));
        var sheet_name_list = workbook.SheetNames;

        var json = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])
        //console.log(json);
        var title = '';
        var years = '';

        json.forEach(function(item) {
          //console.log('item', item);
          for (var i in item) {
            title = i;
            var pos = title.indexOf('1)');
            if (pos !== -1) {
              title = title.substring(0, pos);
            }
            break;
          }
          return;
        });
        console.log('---- ', title, ' ----');
        result[title] = {};
        var years = [];
        for (var y in json[0]) {
          years.push(json[0][y]);
          if (y === 1) break;
        }
        //years.shift();
        var subsubtitle = null;
        var subtitle = null;
        var yearcount = 0;
        for (var y = 0; y < years.length; y++) {
          yearcount++;
          if (!result[title][years[y]]) {
            result[title][years[y]] = {};
          }
          for (var i = 1; i < json.length; i++) {
            //            console.log(i,result);
            //console.log(result);
            var count = 0;
            for (var k in json[i]) {
              subsubtitle = json[i][k];
              if (count === 0) {
                //result[title][years[y]][subtitle]={};
                if (Object.keys(json[i]).length === 1) {
                  //subsubtitle = subtitle;
                  if (subtitle !== json[i][k]) {
                    console.log(1, '--', subtitle);
                    subtitle = json[i][k];
                  }
                }
              } else {
                if (!result[title][years[y]][subtitle]) {
                  if (!result[title][years[y]][subtitle]) {
                    result[title][years[y]][subtitle] = {};
                  }
                  if (subsubtitle) {
                    if (!result[title][years[y]][subtitle][subsubtitle]) {
                      //                      console.log(years[y],'subtitle',subtitle,'subsubtitle','>>>'+subsubtitle+'<<<',k);
                      //console.log(json[i]);
                      var ct = 0;
                      var subsubsubtitle = null;
                      for (var it in json[i]) {
                        if (ct === 0) {
                          subsubsubtitle = json[i][it];
                          console.log('-' + subsubsubtitle + '-');
                          //console.log('item',ct, it,json[i][it], json[i]); 
                        } else {
                          //console.log('.------',json[i][it]);
                        }
                        if (ct === yearcount) {
                          console.log(' > ', subtitle, '/', subsubtitle, '/', subsubsubtitle, ':', json[i][it]);
                        }

                        ct++;
                      };
                      result[title][years[y]][subtitle][subsubtitle] = json[i][k];
                    }
                  } else {
                    //console.log('else', subtitle); 
                    result[title][years[y]][subtitle] = json[i][k];
                  }
                }

              }
              count++
            }
          }
        }

      }
      resolveCount++;
      console.log(resolveCount);
      if (resolveCount === excels.length) {
        q.resolve(result);
      }
    });
  });

  return q.promise;
}




function getEnergy() {
  console.log('getEnergy');
  //https://transparency.entsoe.eu/generation/r2/waterReservoirsAndHydroStoragePlants/show?name=&defaultValue=false&viewType=GRAPH&areaType=CTY&atch=false&dateTime.dateTime=01.01.2013+00:00|UTC|YEAR&dateTime.endDateTime=01.01.2017+00:00|UTC|YEAR&area.values=CTY|10YAT-APG------L!CTY|10YAT-APG------L
  var q = $q.defer();
  fs.readFile('./data/energy.json', 'utf8', function(err, data) {
    if (err) {
      q.reject(err);
    } else {
      obj = JSON.parse(data);
      obj = parseEnergy(obj);
      q.resolve(obj);
    }
  });
  return q.promise;

}

function parseEnergy(data) {
  console.log(data);
  var energy = [];
  for (var i = 2015; i < 2018; i++) {
    var val = 'val' + (i - 2015 + 1);
    data.chartData.forEach(function(week) {
      energy.push({
        year: i,
        week: parseInt(week['cat']),
        value: parseInt(week[val])
      });
    });
  }
  return energy;

}

function getDays(day, pid, resolution, reload, days) {
  var q = $q.defer();
  var d = moment(day, 'YYYYMMDD');
  var all = [];
  for (var t = 0; t < days; t++) {
    var theDay = d.add(1, 'day').format('YYYYMMDD') + '000000';
    all.push(getChart(theDay, pid, resolution, reload))
  }

  $q.all(all).then(function(results) {
    var base = results[0];
    var values = [];
    results.forEach(function(result, i) {
      if (i > 0) {
        var streams = result.d.ResponseData[1].DataStreams;
        var timestrings = result.d.ResponseData[1].Times;
        base.d.ResponseData[1].Times = base.d.ResponseData[1].Times.concat(timestrings);
        streams.forEach(function(stream, j) {
          var values = result.d.ResponseData[1].DataStreams[j].ValueStrings;
          base.d.ResponseData[1].DataStreams[j].ValueStrings = base.d.ResponseData[1].DataStreams[j].ValueStrings.concat(values);
        });

      }
      //      base.d.ResponseData[1].DataStreams.ValueStrings.concat(value);
    });
    q.resolve(base);
  });
  return q.promise;
};



function getChart(day, pid, resolution, reload) {
  var q = $q.defer();
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
      if (result.rows[0] && !reload) {
        q.resolve(result.rows[0].data);
      } else {
        var options = {
          method: 'POST',
          url: 'https://www.apg.at/transparency/WebMethods/ChartsEtc.aspx/GetChartData',
          headers: {
            'User-Agent': 'request'
          },
          json: {
            "PID": pid,
            "DateString": day,
            "Resolution": resolution,
            "Language": "de",
            "AdditionalFilter": "B19|B16|B01|B04|B05|B06|B09|B10|B11|B12|B15|B17|B20|all"
          }
        }
        request(options, function(error, response, body) {
          if (error) {
            q.reject(error);
          } else {
            q.resolve(body);
            //delete if exists
            const query1 = {
              text: 'DELETE FROM chart where day = $1 AND pid = $2 AND resolution = $3',
              values: [day, pid, resolution],
            }
            pool.query(query1)
              .then(function() {
                insertToChart(day, body, pid, resolution);
              })
              .catch(function() {
                insertToChart(day, body, pid, resolution);
              });
          }
        });
      }
    })
    .catch(e => console.error(e.stack))
  return q.promise;
}

function insertToChart(day, body, pid, resolution) {
  const query2 = {
    text: 'INSERT INTO chart(day, data, pid, resolution) VALUES($1, $2, $3, $4)',
    values: [day, body, pid, resolution],
  }
  pool.query(query2)
    .then(res => console.log(query2))
    .catch(e => console.error(e.stack))

}


app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
