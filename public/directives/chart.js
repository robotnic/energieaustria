angular.module('charts', ['nvd3','energiecharts','manipulate'])

.directive('chart', function() {
  return {
    $scope:{
      ctrl:'=',
      mutate:'=',
      activeTab:'=',
      viewdata:'=',
      data:'='
    },
    template:'<br/><nvd3 options="options" data="viewdata" api="api"></nvd3><pre>{{viewdata|json}}',
    controller: function($scope, dataManager, $q, manipulator) {
      $scope.free={
        pump:0,
        unused:0
      };
 
      $scope.ctrl.myDate=moment($scope.ctrl.date);
      //init();     
      $scope.reload = function(){
        init(null, true);
      }
          
      //time navigation

      $scope.$watch('ctrl',function(newvalue, oldvalue, scope){
        if(newvalue.myDate){
          var date=moment($scope.ctrl.myDate).startOf($scope.ctrl.timetype);
          DateString=moment(date).format('YYYYMMDD');
          
          if($scope.ctrl.date !== DateString){
            $scope.ctrl.date=DateString;
            init(DateString);
          }

          switch($scope.ctrl.timetype){
            case 'day':
              $scope.ctrl.titledate = moment($scope.ctrl.date).format('YYYY MMM DD');
              break;
            case 'week':
              var from=moment($scope.ctrl.date).startOf($scope.ctrl.timetype);
              var to=moment($scope.ctrl.date).endOf($scope.ctrl.timetype);
              if(from.format('MMM') === to.format('MMM')){
                $scope.ctrl.titledate = from.format('YYYY') + ' ' + from.format('MMM') + ' ' + from.format('DD') + '  - ' +to.format('DD');;
              }else{
                $scope.ctrl.titledate = from.format('YYYY') + ' ' + from.format('MMM') + ' ' + from.format('DD') + '  - ' + to.format('MMM') + ' '  +to.format('DD');;
              }
              break;
            case 'month':
              var from=moment($scope.ctrl.date);
              $scope.ctrl.titledate = from.format('YYYY') + ' ' + from.format('MMM');
              break;
            default:
              $scope.ctrl.titledate = 'loading...';
          

          }
          if($scope.api){ 
            setTimeout(function(){
              console.log('$scope.api', $scope.api);
              $scope.api.updateWithData($scope.viewdata);
            },10000);
          }
        }
      },true);

      
      //nvd3

$scope.config = {
    visible: true, // default: true
    extended: false, // default: false
    disabled: false, // default: false
    refreshDataOnly: false, // default: true
    deepWatchOptions: true, // default: true
    deepWatchData: true, // default: true
    deepWatchDataDepth: 2, // default: 2
    debounce: 10 // default: 10
};

      $scope.options = {
        chart: {
            type: 'multiChart',
            height: 650,
            margin : {
                top: 120,
                right: 80,
                bottom: 100,
                left: 60
            },
            color: d3.scale.category10().range(),
            zoom:{
       enabled: true,
        scale: 0,
        scaleExtent: [1, 100],
        translate: [0, 0],
        useFixedDomain: false,
        useNiceScale: false,
        horizontalOff: false,
        verticalOff: true,
            },
            useInteractiveGuideline: true,
            duration: 500,
            yLabel:'soso',
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
            yAxis1: {
                tickFormat: function(d){
                    return d3.format(',.1f')(d);
                },
                axisLabel:'GW'
            },
            yAxis2: {
                tickFormat: function(d){
                    return d3.format(',.1f')(d);
                },
                axisLabel:'€/MWh'
            },
            legend: {
              margin:{
                left:-700,
                bottom:200
              },
              dispatch: {
                  stateChange: function(e) {
                    legendStateChanged();
                  }
              }
            },
/*
            tooltip: {
              contentGenerator: function(d) { 
                console.log(d);
                var yValue = d.series[0].value;
                if(d.series[0].values){
                  d.series[0].values.forEach(function(value){
                    if(value.x === d.value){
                      yValue=value.display.y;
                    }
                  });
                }
                var name = d.series[0].key;
                var time = moment(d.point.x).format('MMMM Do YYYY, HH:mm');
                return time + '<h3>' + name + ': ' + yValue + '</h3>';
              }
            }
*/

        }
      };

      //load charts

      function init(dateString, reload){
        dataManager.getSources().then(function(sources){;
          $scope.sources = sources;
          dataManager.loadCharts(dateString, $scope.ctrl, reload).then(function(data){
            $scope.data = data;
            var values=[];
            $scope.data[0].values.forEach(function(value){
              values.push({x:value.x,y:0});
            })
            var surplus = 0;
            if ($scope.ctrl.keep) {
              surplus = $scope.ctrl.pumpsurplus;
              console.log(' init keep' , $scope.ctrl, surplus, $scope.ctrl.pumpsurplus);
            }
            console.log('init', surplus, $scope.ctrl);
            var manipulationResult = manipulator.manipulate($scope.data, $scope.mutate, $scope.sources, $scope.ctrl);   //here the manipulation happens
            $scope.viewdata = manipulationResult.data;
            $scope.ctrl.totals = manipulationResult.totals;
            $scope.ctrl.originalTotals = manipulationResult.originalTotals;
            var hash = readHash();
          },function(error){
            console.log(error);
          });
        });
      }

      //watch manipulation
      $scope.$watch('mutate',function(value){
        if ($scope.ctrl.timetype === 'month') {
          console.log('duration before',$scope.options.chart.duration);
          $scope.options.chart.duration = 0;
          console.log('duration after',$scope.options.chart.duration);
        }else{
          $scope.options.chart.duration = 500;
        }
        if(typeof($scope.data)!=='undefined'){
          var surplus = 0;
          if ($scope.ctrl.keep) {
            surpulus = $scope.ctrl.pumpsurplus;
          }
          console.log('init2', $scope.ctrl);
          var manipulationResult = manipulator.manipulate($scope.data, $scope.mutate, $scope.sources, $scope.ctrl);   //here the manipulation happens
          console.log(manipulationResult);
          $scope.viewdata = manipulationResult.data;
          $scope.ctrl.totals = manipulationResult.totals;
          $scope.ctrl.pumpsurplus = manipulationResult.pumpsurplus;
          readHash();
          if($scope.api){
            //$scope.api.refresh();
          }
          setHash();
        }
      },true);


      //Deeplinking

      function legendStateChanged(){
        console.log('legend');
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

      function setHash(){
        var code = $scope.ctrl.layercode || '';
        var mutateString=';'
        for(var m in $scope.mutate){
          mutateString = mutateString + m + '=' + $scope.mutate[m] + '&';
        }; 
        mutateString = mutateString.slice(0, -1);
        location.hash='!#' + moment($scope.ctrl.myDate).format('YYYY-MM-DD', 'eb', true)+';'+$scope.ctrl.timetype + ';' + code + mutateString + ';' + $scope.activeTab;
      }

      function readHash(){
        console.log('readHash');
        var layercode= $scope.ctrl.layercode + '';
        for(var i = 0; i< layercode.length;i++){
          if($scope.ctrl.layercode[i] === '0' && $scope.viewdata[i]){
            $scope.viewdata[i].disabled = true;
          }
        }
      } 
    }

  }
});
