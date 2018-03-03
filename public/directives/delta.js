angular.module('delta', ['nvd3','energiecharts'])

.directive('delta', function() {
  return {
    scope:{
      ctrl:'=',
      totals:'=',
      sources:'='
    },
    template:'    <nvd3 options="options" data="data"></nvd3>All values are in GWh',
    controller: function($scope, dataManager, $q) {
      console.log($scope.ctrl,$scope.totals, $scope.sources, '----');
      $scope.$watch('ctrl',function(){
        $scope.data.length = 0;
        $scope.data2.length = 0;
        populate('totals');
        populate('originalTotals');
        populate('cumulativeTotals');
      },true);

      function populate(type){
        var colors = {
          "totals":"green",
          "originalTotals":"lightgreen",
          "cumulativeTotals":"green"
        }
        

        fueltype = 'fossil';
        var chart = {
            "key": type,
            "color": colors[type],
            "values": []
        }
        for (var t in $scope.ctrl[type]){
          var value = {
            "label" : t,
            "value" : $scope.ctrl[type][t]
          } 
          chart.values.push(value);
        }
        if(type === 'cumulativeTotals'){
          $scope.data2.push(chart);
        }else{
          $scope.data.push(chart);
        }
      }


        $scope.options = {
            chart: {
                type: 'discreteBarChart',
                height: 450,
                width: 650,
                margin:{
                  left:150,
                  bottom:150
                },
                x: function(d){return d.label;},
                y: function(d){return d.value;},
                //yErr: function(d){ return [-Math.abs(d.value * Math.random() * 0.3), Math.abs(d.value * Math.random() * 0.3)] },
                showControls: true,
                showValues: true,
                duration: 500,
                xAxis: {
                    showMaxMin: false,
                    rotateLabels:-45
                },
                yAxis: {
                    axisLabel: 'Values',
                    tickFormat: function(d){
                        return d3.format(',.2f')(d);
                    }
                },
                color:function(a){
                  return color(a);
                }

            }
        };
 
        $scope.options2 = {
            chart: {
                type: 'discreteBarChart',
                height: 380,
                width: 380,
                margin:{
                  left:150,
                  bottom:150
                },
                x: function(d){
                  return d.label;
                },
                y: function(d){return d.value;},
                //yErr: function(d){ return [-Math.abs(d.value * Math.random() * 0.3), Math.abs(d.value * Math.random() * 0.3)] },
                showControls: true,
                showValues: true,
                duration: 500,
                xAxis: {
                    showMaxMin: false,
                    rotateLabels:-45
                },
                yAxis: {
                    axisLabel: 'Values',
                    tickFormat: function(d){
                        return d3.format(',.2f')(d);
                    }
                },
                color:function(a){
                  return color(a);
                }
            }
        };
                 
    function color(a){
      if($scope.sources && $scope.sources[a.label]){
          var color = $scope.sources[a.label].color;
          if(a.series === 1){
            color = '#00000030';
          }
          return color;
      }
      return '#ff0000';
    }
    $scope.data = [];
    $scope.data2 = [];
     }
  }
});

