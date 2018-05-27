angular.module('diffcharts', ['nvd3','energiecharts','manipulate'])

.directive('diffchart', function() {
  return {
    scope:{
      ctrl:'=',
      mutate:'=',
      activeTab:'=',
      viewdata:'=',
      origdata:'=',
      data:'='
    },
    template:'<br/><nvd3 options="options" data="delta" api="api"></nvd3>',
    controller: function($scope, dataManager, $q, manipulator) {
      //nvd3


      $scope.$watch('viewdata',function(){
        $scope.delta = makeDelta($scope.viewdata, $scope.data);
        console.log('delta',$scope.delta);
      });

      function makeDelta(viewdata, data) {
        var delta = JSON.parse(JSON.stringify(viewdata));
        console.log('viewdata',viewdata, data);
        viewdata.forEach(function(chart,i){
          data.forEach(function(oldchart,j){
            if(chart.key === oldchart.key){
              delta[i].type='line';
              chart.values.forEach(function(value,j){
                delta[i].values[j].y = value.y - oldchart.values[j].y;
              });
            }
          });
        });
        return delta;
      }

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
        }
      };

    }
  }
});
