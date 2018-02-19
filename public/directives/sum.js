angular.module('sum', ['nvd3','energiecharts'])

.directive('sum', function() {
  return {
    scope:{
      ctrl:'=',
      totals:'=',
      sources:'='
    },
    template:'<nvd3 options="options2" data="data"></nvd3>',
    controller: function($scope, dataManager, $q) {
      console.log($scope.ctrl,$scope.totals, $scope.sources, '----');
      $scope.$watch('ctrl',function(){
        console.log('DELTA', $scope.ctrl.totals);
        console.log('ODELTA', $scope.ctrl.originalTotals);
        $scope.data.length = 0;
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
          $scope.data.push(chart);

          //clone
          var chartClone = JSON.parse(JSON.stringify(chart));
          chartClone.key = 'delta';
          chartClone.values.forEach(function(item){
            console.log(item.label, $scope.ctrl.totals[item.label]);
            item.value = $scope.ctrl.totals[item.label];
          });
          $scope.data.push(chartClone);
          console.log('chartClone',chartClone);
        }  
      }


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
                y: function(d){return Math.round(d.value);},
                //yErr: function(d){ return [-Math.abs(d.value * Math.random() * 0.3), Math.abs(d.value * Math.random() * 0.3)] },
                showControls: true,
                showValues: true,
                duration: 500,
        valueFormat: function(d){
            return d3.format(',.1f')(d);
        },
                xAxis: {
                    showMaxMin: false,
                    rotateLabels:-45
                },
                yAxis: {
                    axisLabel: 'GWh',
                    tickFormat: function(d){
                        return d3.format(',.1f')(d);
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
          if(a.series === 0){
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

