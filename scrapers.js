/*
Sorry, it's a bit a mess in this file
*/

var request = require('request');
var moment = require('moment');
var $q = require('q');
var fs = require('fs');

var cookie = null;

var XLSX = require('xlsx');

module.exports={
  getChart: function(day, pid, resolution, reload){
    return getChart(day, pid, resolution, reload)
  },
  getDays: function(day, pid, resolution, reload, days){
    return getDays(day, pid, resolution, reload, days)
  },
  getEnergy: function(day, pid, resolution, reload, days){
    return getEnergy(day, pid, resolution, reload, days)
  },
  loadStatistics:function(){
    return loadStatistics()
  },
  loadStorage:function(){
    return loadStorage()
  },
  getSectors: function(sector,year){
    return getSectors(sector,year)
  },
  createTables: createTables,
  getStorage: getStorage
}


const {
  Pool,
  Client
} = require('pg')
var pool = null;
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
  });
}else{
  console.log('local db');
  var dbconnect = JSON.parse(fs.readFileSync('config/dbconnect.json', 'utf8'));
  pool = new Pool(dbconnect);
}

function getSectors(sector, year){
  if(!sector && !year){
    var sectors = [];
    for (var s in statistics) {
      sectors.push(s);
    }
    return sectors;
  }

  if(!year){
    var stat = statistics[sector];
    if (sector === 'Tabelle1') {
      var selected = parseTabelle1(stat);
    } else {
      var selected = select(stat, '30', '36');
    }
    return selected;
  }

  //else
  var result = {};
  var stat = statistics[sector];
  var selected = select(stat, '30', '36');
  for (var s in selected) {
    result[s] = selected[s][year];
  }
  if (sector === 'Tabelle1') {
    result = parseTabelle1(stat)[year];
    delete result['Insgesamt'];
  }
  return result;

}




function parseTabelle1(stat) {
  var ret = {};
  var title = 'nix';
  var titleArray = [];
  for (var s in stat) {
    var sx = parseInt(s.substring(1));
    if (sx === 2) {
      firstLine = stat[s];
      title = firstLine.v
      if (title) {
        title = (title + '').replace(/[\n\r\t-]/g, '');
      }
      titleArray.push(title);
      ret[title] = {};
    } else {
      if (s[0] === 'A') {
        title = stat[s].v;
      } else {
        var char = s[0].charCodeAt(0) - 65;

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
  var r = getItems(stat, a, b, xAxis);
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
  var l = xAxis.length;
  var rows = {};
  var title = "nix";

  for (var s in stat) {
    //    console.log(s);
    var c = s[0];
    var sx = parseInt(s.substring(1));
    if (sx && a <= sx && sx <= b) {
      if (c === 'A') {
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


function loadStorage(){
  //https://www.e-control.at/de/statistik/strom/marktstatistik/kennzahlen_wasser_waerme
  var q = $q.defer();
  if(hydrostorage){
    q.resolve(hydrostorage);
  }
  var storage={};
  var url = 'https://www.e-control.at/documents/20903/724575/MStWW2_Spe-2017.xlsx/6bc38892-0661-74fb-2b87-a109992d89c0';
  loadFile(url).then(function(excel){
    //console.log('STORAGE', excel.Sheets.Wa);
    var first = "A", last = "Z";
    for(var i = first.charCodeAt(0); i <= last.charCodeAt(0); i++) {
        var c = String.fromCharCode(i);
        var cell = excel.Sheets.Wa[c+'6'];
        if(cell){
          var colname = cell.v;
          if(storage[colname]){
            colname = colname+'%';
          }
          storage[colname]=[];
          for(var n=8; n<20;n++){
            //console.log(c+n);
            var valueCell = excel.Sheets.Wa[c+n];
            if(valueCell){
              var month = excel.Sheets.Wa['B'+n];
              storage[colname].push(valueCell.v);
            }
          }
        }
    }
    q.resolve(storage);
  });
  return q.promise;
}

var hydrostorage = null;
loadStorage().then(function(storage){
  hydrostrorage = storage;
});



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
    'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022719',
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
  var energy = [];
  for (var i = 2015; i < 2020; i++) {
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
//  getCookie().then(function(cookie){
  pool.query(select)
    .then(function(result) {
      if (result.rows[0] && !reload) {
        q.resolve(result.rows[0].data);
      } else {
        var options = {
          method: 'POST',
          url: 'https://www.apg.at/transparency/WebMethods/ChartsEtc.aspx/GetChartData',
          headers: {
            'User-Agent': 'https://github.com/robotnic/energyaustria'
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
 //   })
 //   .catch(e => console.error(e.stack))
  });
  return q.promise;
}

function getStorage(year){
  var q = $q.defer();
  var url = 'https://www.energy-charts.de/energy/year_storage_' + year + '.json';
  console.log(url);
  request(url, function(error, response, body){
    if (error) {
      q.reject(error);
    }else {
      q.resolve(body);
    }
  });
  return q.promise;
}

function insertToChart(day, body, pid, resolution) {
  var query =  'INSERT INTO chart(day, data, pid, resolution) VALUES($1, $2, $3, $4)';
  var query2 = {
    text: query,
    values: [day, body, pid, resolution],
  }
  pool.query(query2)
    .then(res => console.log('done', query))
    .catch(e => console.error(e.stack))

}

function createTables(){
  //var promises = [createTableChart(), createTableStorage];  //not needed can not cache
  var promises = [createTableChart()];
  return $q.all(promises);
}

function createTableChart(){
  var all = [];
  var q = $q.defer();
  //charts
  let createTableQuery = `CREATE TABLE IF NOT EXISTS chart
  (
    id integer,
    day character varying,
    data json,
    type character varying,
    pid character varying,
    resolution character varying
  )
  `
  pool.query(createTableQuery, err => {
    if (err) return done(err)
    q.resolve('table created');
  })
  return q.promise;
}

function createTableStorage(){
  //storage
  let createTableQuery = `CREATE TABLE IF NOT EXISTS storage
  (
    id integer,
    data json,
  )
  pool.query(createTableQuery, err => {
    if (err) return done(err)
    q.resolve('table created');
  })

 `
  return q.promise;
}

function getCookie(){
  var q=$q.defer();
  if (cookie){
    q.resolve(cookie);  
  }else{
    var url="https://www.apg.at";
    request(url,function(error,response,body){
      cookie = response.headers['set-cookie'][0].split(';')[0];
      console.log(cookie);
    });
  }
  return q.promise
}
