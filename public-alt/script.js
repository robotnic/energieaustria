angular.module('energy',["nvd3", 'angularMoment','ngMaterial'])
.config(function($mdDateLocaleProvider) {
    $mdDateLocaleProvider.formatDate = function(date) {
       return moment(date).format('YYYY-MMM-DD');
    };
})
.config(function($mdIconProvider) {
  $mdIconProvider.fontSet('md', 'material-icons');
})
.controller('chart', function($scope, $http, moment, $timeout, $q) {
  var PID =  'AGPT'; //'EXAAD1P'; //AL, AGPT
  $scope.multiplayer = 1;
  $scope.rc = {}
  var timestamps= [];
  $scope.data = [];
  var DateString = null;
  var date=null;
  if(!location.hash){
    date = moment().subtract(3,'day');
    timetype = 'day';
    layercode = '0111111111111111111111';
  }else{
    var hash=location.hash.slice(1);
    var d=hash.split(';')[0];
    var timetype=hash.split(';')[1];
    var layercode=hash.split(';')[2];
    date=moment(d);
    if(typeof(timetype) === 'undefined' || timetype === 'undefined'){
      timetype = 'day';
    }
    if(typeof(layercode) == 'undefined' || layercode == 'undefined'){
      layercode = '0111111111111111111111';
    }
 
  }
  $scope.ctrl ={
    myDate:date,
    timetype:timetype,
    minDate:new Date('2015-01-01'),
    layercode:layercode
  }
  $scope.$watch('ctrl', function(){
    var date=moment($scope.ctrl.myDate).startOf($scope.ctrl.timetype);
    DateString=moment(date).format('YYYYMMDD')+"000000";
    init(DateString, PID);
    //init(DateString, 'AL');
    //location.hash=$scope.ctrl.myDate;
    //location.hash=moment($scope.ctrl.myDate).format('YYYY-MM-DD', 'eb', true)+';'+$scope.ctrl.timetype + ';' +$scope.layercode;
    setHash();
  },true);


  function setHash(){
    var code = $scope.ctrl.layercode || '';
    location.hash=moment($scope.ctrl.myDate).format('YYYY-MM-DD', 'eb', true)+';'+$scope.ctrl.timetype + ';' + code;
  }


  function init(DateString, pid, reload){
    console.log('--init---', colors);
    var legendState = {}
    var i = 0;
    for (var c in colors) {
       var bin = $scope.ctrl.layercode[i]; 
        if(bin === '1') {
          legendState[c] = false;
        }else{
          legendState[c] = true;
        }
        
        i++
    }


    //var query = {"PID":pid,"DateString":DateString.toString(),"Resolution":"15M","Language":"de","AdditionalFilter":"B19|B16|B01|B04|B05|B06|B09|B10|B11|B12|B15|B17|B20|all"}
    var query = {"PID":pid,"DateString":DateString.toString(),"Resolution":"15M","Language":"de"}
    if(PID === 'EXAAD1P'){
      query.AdditionalFilter = null;
    }else{
      query.AdditionalFilter = "B19|B16|B01|B04|B05|B06|B09|B10|B11|B12|B15|B17|B20|all";
    }
    
    $scope.data.length = 0;
    timestamps.length = 0;
    var url ='/' + $scope.ctrl.timetype;
    if (reload) {
      url+='?reload=true';
    }
    $scope.loading = true;
    $http.post(url, query).then(function(response) {
      $scope.loading = false;
      response.data.d.ResponseData[1].Times.forEach(function(time,i) {
        var date = response.data.d.ResponseData[1].Times[i];
        var timestamp = parseInt(moment(date.DateLocalString + ' ' + date.TimeLocalFromString, "DD-MM-YYYY HH:mm").format('x'));
        timestamps.push((timestamp));
      });
      for(var type in colors){
        response.data.d.ResponseData[1].DataStreams.forEach(function(stream,i) {
          var values=[] ;
          var disabled = false;
          var delta = 0;
          if(stream.YAxisTitle === type){
            var line = lineExists(stream.YAxisTitle);
            stream.ValueStrings.forEach(function(value,t) {
              if(!value){
                console.log('nix value');
                value=0
              }
              if(line){
                delta = line.values.length;
              }
              value = value.toString();
              value = parseFloat(value.replace('.',''));
              value = parseInt(value);
              values.push({
                x: timestamps[t + delta], 
                y: value/1000
              });
            });
            values.sort(function(a,b){
              if( a.x < b.x){
                return -1;
              };

              if( a.x > b.x){
                return 1;
              };
              return 0;
            });
            if($scope.data[0] && values.length > $scope.data[0].values.length){
              //values.length = $scope.data[0].values.length
              values.unshift();
              values.length = $scope.data[0].values.length
            }
            if(type === 'Pumpspeicher') {
              disabled = true;
            }
            if(line) {
              line.values = line.values.concat(values);
            } else{
              line = {
                key: stream.YAxisTitle,
                originalKey: stream.YAxisTitle,
                color: makeColor(stream.YAxisTitle),
                disabled: legendState[type],
                "yAxis": 1,
                "type": "stackedAreaChart",
                values: values,
              };
              $scope.data.push(line);
            }
          }
        });
      }
      console.log('before refresh', $scope.data);
/*
      $scope.data[0].values.forEach(function(ddd){
        //console.log('ddd',  ddd[0]);
      });
*/
      $scope.viewdata= JSON.parse(JSON.stringify($scope.data));;
      manipulate();
      $timeout(function(){
        $scope.rc.api.refresh();
      });
    })
  }

  function manipulate(){
    console.log('ready to go', $scope.data);
    $scope.data.forEach(function(item,i){
      if (item.key === "Solar") {
        item.values.forEach(function(value,j){
          $scope.viewdata[i].values[j].y = value.y * $scope.multiplayer;
        });
      }
    });
  }

  $scope.$watch('multiplayer',function(){
    debounce();
  });

  var timeout=null;
  function debounce(){
    if(timeout){
      clearTimeout(timeout);
    }
    timeout = setTimeout(function(){
      console.log('refresh');
      init(DateString, PID);
    },500); 
  };

  function lineExists(title){
    var exists = false;
    $scope.data.forEach(function(item) {
      if (item.key === title) {
        exists = item;
        console.log('super',item.key, title);
      };
    });
    return exists;
  }


  $scope.previouseDay=function(){
    var delta = 1;
    switch($scope.ctrl.timetype){
      case 'week':
        delta=7;
        break;
      case 'month':
        delta = 31;
        break;
      default:
        delta = 1;
    }
 
    $scope.ctrl.myDate=moment($scope.ctrl.myDate).subtract(delta,'d');
  }

  $scope.nextDay=function(){
    var delta = 1;
    switch($scope.ctrl.timetype){
      case 'week':
        delta=7;
        break;
      case 'month':
        delta = 31;
        break;
      default:
        delta = 1;
    }
    $scope.ctrl.myDate=moment($scope.ctrl.myDate).add(delta,'d');
  }


  $scope.reload=function(){
    init(DateString, PID, true);
  }


/* chart */

 $scope.options = {
    chart: {
      type: 'stackedAreaChart',
      height: 600,
      margin: {
        top: 20,
        right: 20,
        bottom: 80,
        left: 70
      },
      useVoronoi: true,
      clipEdge: true,
      duration: 100,
      useInteractiveGuideline: true,
      xAxis: {
        ticks:8,
        showMaxMin: false,
        tickFormat: function(d) {
          var t=0;
          switch($scope.ctrl.timetype){
            case 'day':         
              t= moment(d).format('HH:mm');  //d3.time.fmt(rmat('%x')(new Date(d))
              break;
            case 'week':         
              t= moment(d).format('ddd DD.MMM.YYYY HH:mm');  //d3.time.fmt(rmat('%x')(new Date(d))
              break;
            default: 
              t= moment(d).format('ddd DD.MMM.YYYY');  //d3.time.fmt(rmat('%x')(new Date(d))
          }
        return t;
          //return d3.time.fmt(rmat('%x')(new Date(moment(d).format('DD.MMM HH:mm'))));
        },
        rotateLabels: 20,
      },
      y1Axis: {
        "axisLabel": "Erzeugung (GW)",
        tickFormat: function(d) {
          return d3.format(',.2f')(d);
        }
      },
      y2Axis: {
        "axisLabel": "Erzeugung (GW)",
        tickFormat: function(d) {
          return d3.format(',.2f')(d);
        }
      },
 
      zoom: {
        enabled: true,
        scaleExtent: [1, 10],
        useFixedDomain: false,
        useNiceScale: false,
        horizontalOff: false,
        verticalOff: true,
        unzoomEventType: 'dblclick.zoom'
      },
      showLegend: true,
      legend: {
        dispatch: {
            stateChange: function(e) {
              legendStateChanged();
            }
        }
      }
    }
  };



function legendStateChanged(){
  var legendState = {};
  $scope.ctrl.layercode = '';
  $scope.viewdata.forEach(function(item) {
    legendState[item.key]=item.disabled;
     if (item.disabled){
      $scope.ctrl.layercode += "0";
    }else{
      $scope.ctrl.layercode += "1";
    }

  });
  setHash();
}

$scope.config = {
    visible: true, // default: true
    extended: false, // default: false
    disabled: false, // default: false
    refreshDataOnly: true, // default: true
    deepWatchOptions: true, // default: true
    deepWatchData: false, // default: true
    deepWatchDataDepth: 2, // default: 2
    debounce: 10 // default: 10
};

/* Colors */

var colors=null;

$http.get('config/colors.json').then(function(response){
  colors = response.data;
}, function(error){
  console.log(error);
});


function makeColor(string){
  var color= '#ffffff';
  if(colors[string]){
    color = colors[string];
  }
  return color;
};


});
