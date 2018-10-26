angular.module('charts', ['nvd3','energiecharts','manipulate'])

.directive('chart', function() {
  return {
    scope:{
      ctrl:'=',
      mutate:'=',
      activeTab:'=',
      viewdata:'=',
      data:'=',
      reload:'&'
    },
    template:'<br/><nvd3 options="options" data="viewdata" api="api"></nvd3>',
    controller: function($scope, dataManager, $q, manipulator) {
      $scope.free={
        pump:0,
        unused:0
      };

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
//        setHash();
      }
/*
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
*/
    }

  }
});
