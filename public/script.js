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
  $scope.rc = {}
  var timestamps= [];
  $scope.data = [];
  var DateString = null;
  var date=null;
  if(!location.hash){
    date = moment().subtract(3,'day');
  }else{
    date=moment(location.hash.slice(1))
  }
  console.log(date);
  $scope.ctrl ={
    myDate:date,
    timetype:'day',
    minDate:new Date('2015-01-01')
  }
  $scope.$watch('ctrl', function(){
    var date=moment($scope.ctrl.myDate).startOf($scope.ctrl.timetype);
    DateString=moment(date).format('YYYYMMDD')+"000000";
    console.log(DateString);
    init(DateString, 'AGPT');
    //init(DateString, 'AL');
    $timeout(function(){
      //init(DateString, 'AL');
      console.log($scope.data);
    },2000);



    $timeout(function(){
      $scope.loaded=true;
      console.log($scope.rc.api);
    },3000);
    //location.hash=$scope.ctrl.myDate;
    location.hash=moment($scope.ctrl.myDate).format('YYYY-MM-DD', 'eb', true);
  },true);

/*
  $scope.$watch('data', function(){
    console.log($scope.data)
  },true);
*/

  function init(DateString, pid, reload){
    var legendState = JSON.parse(localStorage.getItem('legendstate'));
    //var query = {"PID":pid,"DateString":DateString.toString(),"Resolution":"15M","Language":"de","AdditionalFilter":"B19|B16|B01|B04|B05|B06|B09|B10|B11|B12|B15|B17|B20|all"}
    var query = {"PID":pid,"DateString":DateString.toString(),"Resolution":"15M","Language":"de","AdditionalFilter":"B19|B16|B01|B04|B05|B06|B09|B10|B11|B12|B15|B17|B20|all"}
    $scope.data.length = 0;
    timestamps.length = 0;
    var url ='/' + $scope.ctrl.timetype;
    if (reload) {
      url+='?reload=true';
    }
    console.log(url, query);
    $http.post(url, query).then(function(response) {
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
              value = parseFloat(value.replace('.',''));
              values.push([timestamps[t + delta], value/1000]);
            });
            values.sort(function(a,b){
              if( a[0] < b[0]){
                return -1;
              };

              if( a[0] > b[0]){
                return 1;
              };
              return 0;
            });
            if(type === 'Pumpspeicher') {
              disabled = true;
            }
            if(line) {
              line.values = line.values.concat(values);
            } else{
              line = {
                key:stream.YAxisTitle,
                values: values,
                color:makeColor(stream.YAxisTitle),
                disabled: legendState[type]
              };
              $scope.data.push(line);
            }
          }
        });
      }
      console.log('before refresh', $scope.data);
      $scope.rc.api.refresh();
    })
    }

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

/*
  function auto(){
    $scope.previouseDay();
    $timeout(function(){
      auto();
    },2000);
  }
  auto();
*/

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
    init(DateString,'AGPT', true);
  }


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
      x: function(d) {
        return d[0];
      },
      y: function(d) {
        return d[1];
      },
      useVoronoi: true,
      clipEdge: true,
      duration: 100,
      useInteractiveGuideline: true,
      xAxis: {
        ticks:14,
        showMaxMin: true,
        tickFormat: function(d) {
          var t=0;
          switch($scope.ctrl.timetype){
            case 'day':         
              t= moment(d).format('HH:mm');  //d3.time.fmt(rmat('%x')(new Date(d))
              break;
            case 'week':         
              t= moment(d).format('ddd HH:mm');  //d3.time.fmt(rmat('%x')(new Date(d))
              break;
            default: 
              t= moment(d).format('ddd DD.MMM.YYYY');  //d3.time.fmt(rmat('%x')(new Date(d))
          }
        return t;
          //return d3.time.fmt(rmat('%x')(new Date(moment(d).format('DD.MMM HH:mm'))));
        },
        rotateLabels: 20,
      },
      yAxis: {
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
  $scope.data.forEach(function(item) {
    legendState[item.key]=item.disabled;
  });
  localStorage.setItem('legendstate',JSON.stringify(legendState));
}

$scope.config = {
    visible: true, // default: true
    extended: false, // default: false
    disabled: false, // default: false
    refreshDataOnly: true, // default: true
    deepWatchOptions: true, // default: true
    deepWatchData: true, // default: true
    deepWatchDataDepth: 2, // default: 2
    debounce: 10 // default: 10
};



var colors={
  'Pumpspeicher': '#cccccc',
  'Lauf- und Schwellwasser': '#0000ff',
  'Kohle': 'black',
  'Öl': 'brown',
  'Gas': '#ff0000',
  'Biomasse': '#f4a460',
  'Wind':  '#add8e6',
  'Sonstige Erneuerbare':  '#00ff00',
  'Geothermie': '#ff99ff',
  'Speicher': 'purple',
   'Solar': '#ffff00',
  'Müll': 'aqua',
  'Andere': 'lightgrey',
  'Leistung [MW]': 'orange'
} 


function makeColor(string){
  console.log(string);
  var color= '#ffffff';
  if(colors[string]){
    color = colors[string];
  }
  console.log(color);
  return color;
};


});
