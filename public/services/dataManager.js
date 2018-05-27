angular.module('energiecharts',[])
.factory('dataManager',function($http, $q){
  var api = {
    loadCharts: loadCharts,
    loadData:loadData,
    getSources: getSources,
    loadExcels:function(){
      return loadExcels();
    },
    getSector:function(type, year){
      return getSector(type,year);
    },
    getHydroStorage:function(year, monthNumber){
      return getHydroStorage(year, monthNumber);
    },
    getInstalled:function(year) {
      return getInstalled(year);
    }
    
  }

  var data = [];
  var hydroStorage = null;
  var timetype = 'day';
  var hydroPromises = [];

  function getInstalled(year) {
    var q = $q.defer();
    $http.get('/data/installed/'+year).then(function(response){
      q.resolve(response.data);
    },function(error){
      q.reject(error);
    });
    return q.promise;
  }

  colors=null;
  function getSources(){
    var q=$q.defer();
      if(colors){
        q.resolve(colors);
      }else{
      $http.get('/default').then(function(response){
        colors = response.data;
        q.resolve(colors);
      }, function(error){
        console.log(error);
        q.reject(error);
      });
    }
    return q.promise;
  }

  function getHydroStorage(year, monthNumber){
    var q = $q.defer();

    if(year){  //overkill
      if(hydroStorage && hydroStorage[year] && hydroStorage[year][monthNumber]){
        q.resolve(hydroStorage[year][monthNumber]);
      } else {
        if(hydroPromises.length === 0){
          $http.get('/data/hydrostorage').then(function(storage){
            hydroStorage = storage.data; 
            try{
              var value = hydroStorage[year][monthNumber];
              hydroPromises.forEach(function(qq){
                qq.resolve(value);
              });
            }catch(e){
              hydroPromises.forEach(function(qq){
                qq.reject(e);
              });
            }
          });
          hydroPromises.push(q);
        }
      }
    }else{
      if(hydroStorage){
        q.resolve(hydroStorage);
      } else {
        if(hydroPromises.length === 0){
          $http.get('/data/hydrostorage').then(function(storage){
            hydroStorage = storage.data; 
            try{
              var value = hydroStorage;
              hydroPromises.forEach(function(qq){
                qq.resolve(value);
              });
            }catch(e){
              hydroPromises.forEach(function(qq){
                qq.reject(e);
              });
            }
          });
          hydroPromises.push(q);
        }
      }
    }
 

    return q.promise;
  }
//  getHydroStorage('2017','0');

  colors=null;

  $http.get('/default').then(function(response){
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
    var url='/data/sectors/' + type + '/' + year;
//    var url='http://localhost:3000/sectors/Gesamtenergiebilanz/2016
    var q = $q.defer();
    $http.get(url).then(function(response){
      q.resolve(response.data);
    },function(error){
      q.reject(error);
    });
    return q.promise;
  }

  function loadCharts(dateString, ctrl, reload){
    var q = $q.defer();
    console.log('--init--', ctrl.layercode, dateString);
    var date = ctrl.date;
    if(dateString){
      date = dateString;
    }
    var data = [];
    ctrl.loading = true;
    var promises = [
      loadData('AGPT',date , 1,ctrl.timetype,'area', null,reload),
      loadData('AL', date,1,ctrl.timetype,'line',null, reload),
      loadData('EXAAD1P', date,2,ctrl.timetype,'line',  function(y){            
        return y*1000;
      }, reload)
    ];

    $q.all(promises).then(function(result){
      ctrl.loading = false;
      result.forEach(function(list){
        data = data.concat(list);
      })
      var values=[];
      data[0].values.forEach(function(value){
        values.push({x:value.x,y:0});
      })
      q.resolve(data);
    }, function(error){
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
    var url ='/chart/' + timetype;
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
        value=0
      }
      value = value.toString();
      value = parseFloat(value.replace('.',''));
      value = (value)/1000;
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
