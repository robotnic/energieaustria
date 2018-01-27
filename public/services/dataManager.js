angular.module('energiecharts',[])
.factory('dataManager',function($http, $q){
  var api = {
    loadData:function(pid, dateString, axis, timetype, type, valueCallback, reload){
      return loadData(pid, dateString, axis, timetype, type, valueCallback, reload);
    },
    getSources:function(){
      return colors;
    },
    loadExcels:function(){
      return loadExcels();
    },
    getSector:function(type, year){
      return getSector(type,year);
    },
    getHydroStorage:function(year, monthNumber){
      return getHydroStorage(year, monthNumber);
    }
    
  }

  var data = [];
  var hydroStorage = null;
  var timetype = 'day';

  function getHydroStorage(year, monthNumber){
    var q = $q.defer();
    if(hydroStorage && hydroStorage[year] && hydroStorage[year][monthNumber]){
      q.resolve(hydroStorage[year][monthNumber]);
    } else {
      $http.get('/hydrostorage').then(function(storage){
        hydroStorage = storage.data; 
        console.log('==========================',year, monthNumber, hydroStorage[year][monthNumber]);
        try{
          q.resolve(hydroStorage[year][monthNumber]);
        }catch(e){
          q.reject(e);
        }
      });
    }
    return q.promise;
  }
  getHydroStorage('2017','0');

  colors=null;

  $http.get('config/sources.json').then(function(response){
    colors = response.data;
  }, function(error){
    console.log(error);
  });


  function makeColor(string){
    var color= '#ffffff';
    if(colors[string]){
      color = colors[string].color;
    }
    return color;
  };

  function getSector(type,year){
    var url='http://localhost:3000/sectors/' + type + '/' + year;
//    var url='http://localhost:3000/sectors/Gesamtenergiebilanz/2016
    var q = $q.defer();
    $http.get(url).then(function(response){
      q.resolve(response.data);
    },function(error){
      q.reject(error);
    });
    return q.promise;
  }


  function loadData(pid, dateString, axis, timetype, type, valueCallback, reload){
    var multiplayer = 1;
    var q = $q.defer();
    var query = {"PID":pid,"DateString":dateString + '000000',"Resolution":"15M","Language":"de"}
    if(pid === 'EXAAD1P'){
      query.AdditionalFilter = null;
      multiplayer = 1000;
    }else{
      query.AdditionalFilter = "B19|B16|B01|B04|B05|B06|B09|B10|B11|B12|B15|B17|B20|all";
    }
    data.length = 0;
    var url ='/' + timetype;
    if (reload) {
      url+='?reload=true';
    }
    $http.post(url, query).then(function(response) {
      var charts = parseData(response.data, axis, type, valueCallback);
      q.resolve(charts);
    }, function(error) {
      q.reject(error);
    });
    return q.promise;
  }

  function parseData(data, axis, type, valueCallback){
    var charts = [];
    var timestamps = [];
    data.d.ResponseData[1].Times.forEach(function(time,i) {
        var date = data.d.ResponseData[1].Times[i];
        var timestamp = parseInt(moment(date.DateLocalString + ' ' + date.TimeLocalFromString, "DD-MM-YYYY HH:mm").format('x'));
        timestamps.push((timestamp));
      });
    if(colors){
      for(var c in colors){
        data.d.ResponseData[1].DataStreams.forEach(function(item,index){
          if(item.YAxisTitle === c){
            charts.push(parseChart(item, timestamps,index, axis, type));
          }
        });
      };
    }
    return charts;

    function parseChart(item, timestamps, index, axis, type){
      var values = [];
      item.ValueStrings.forEach(function(value,i){
        var xy = {
          x:timestamps[i],
          y: parseValue(value)
        }
        values.push(xy);
      });

      //hot fixes
      values.sort(function(a,b){
        if( a.x < b.x){
          return -1;
        };

        if( a.x > b.x){
          return 1;
        };
        return 0;
      });

      var template = { 
        color : makeColor(item.YAxisTitle),
        key : item.YAxisTitle,
        originalKey : item.YAxisTitle,
        seriesIndex : index,
        type : type,
        values : values,
        yAxis : axis 
      }
      return template;
    }

    function parseValue(value){
      if(!value){
        console.log('nix value');
        value=0
      }
      value = value.toString();
      value = parseFloat(value.replace('.',''));
      value = parseInt(value)/1000;
      if(valueCallback){
        value = valueCallback(value);
      }
      return value;
      /*
      values.sort(function(a,b){
        if( a.x < b.x){
          return -1;
        };

        if( a.x > b.x){
          return 1;
        };
        return 0;
      });
      */
    }
  }

  function loadExcels(){
    var excels=[
      'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=115546',
      'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022710',
      'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022712',
      'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022713',
      'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022716',
      'http://www.statistik.at/wcm/idc/idcplg?IdcService=GET_NATIVE_FILE&RevisionSelectionMethod=LatestReleased&dDocName=022718'
    ]
  }

  return api;
});
