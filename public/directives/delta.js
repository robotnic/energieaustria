angular.module('delta', ['nvd3','energiecharts'])

.directive('delta', function() {
  return {
    scope:{
      ctrl:'=',
      totals:'=',
      sources:'='
    },
    template:'    <nvd3 options="options" data="data"></nvd3>',
    controller: function($scope, dataManager, $q) {
      $scope.$watch('ctrl',function(){
        console.log("---------------------------------------------engergy");
        console.log($scope.ctrl.totals);
        $scope.data.length = 0;
        var types = ['original','modified'];
        for(var t in $scope.ctrl.totals){
          var delta = 0;
          var total =  $scope.ctrl.totals[t];
          if(total.modified && total.original){
            var delta = total.modified.sum - total.original.sum;
          }
          if(delta && Math.abs(delta) > 0.00001){
              var chart = {
                "key": t,
                "color": 'red',
                "values": []
              }
            types.forEach(function(type){
              //console.log(t,total.original.sum, total.modified.sum, total.delta);
              if(total[type]){
            
                var color = $scope.sources[t].color
                if(type === 'original'){
                  color = '#00000030';
                }
                var value = {
                  "label":t ,
                  "value":total[type].sum,
                  "color":color
                }
                chart.values.push(value);
              }
              chart.values.push(value);
              $scope.data.push(chart);
            });
          }
        }
        //populate('totals');
        //populate('originalTotals');
        //populate('cumulativeTotals');
      },true);
/*
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
*/


        $scope.options = {
            chart: {
                type: 'discreteBarChart',
                height: 450,
                width: 850,
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
                    axisLabel: 'GWh',
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
      var color = '#ff000070';
      if(a.series === 1){
        color = '#00000030';
      }else{
        if($scope.sources && $scope.sources[a.label]){
            color = $scope.sources[a.label].color;
        }
      }
      return color;
    }

    $scope.data = [];
     }
  }
});

