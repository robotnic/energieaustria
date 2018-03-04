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
      $scope.ctrl.keepTotals = {}
      $scope.ctrl.keepOriginalTotals = {};
      $scope.$watch('ctrl',function(){
        $scope.data.length = 0;
        //populate('totals');
        //populate('originalTotals');
        remember('totals','keepTotals', $scope.ctrl.keep);
        remember('originalTotals','keepOriginalTotals', $scope.ctrl.keep);
        populate('keepTotals');
        populate('keepOriginalTotals');
//        populate('cumulativeTotals');
      },true);

      function remember(partName, sumName, remember){
        if(remember){
          var part = $scope.ctrl[partName]
          var sum = $scope.ctrl[sumName]
          for(var p in part){
            if(sum[p]){
              sum[p] += part[p];
            }else{
              sum[p]=part[p]
            }
          }
        }else{
          if($scope.ctrl[partName]){
            $scope.ctrl[sumName] = JSON.parse(JSON.stringify($scope.ctrl[partName]));
          }
        }
      }

      function populate(type){
        var use = ["Benzin & Diesel", "Pumpspeicher","pump down","pump up", "Power2Gas", "Kohle", "Gas", "Transport"];
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
        /*
        chart.values.forEach(function(item,i){
          console.log(item.label);
          if(use.indexOf(item.label) === -1){
            chart.values.splice(i, 1);
          }
        });
        */
        chart.values = chart.values.filter(function(item){
          if(use.indexOf(item.label) === -1){
            return false;
          }else{
            return true;
          };
        });
        $scope.data.push(chart);
/*
        if(type === 'cumulativeTotals'){

          //clone
          var chartClone = JSON.parse(JSON.stringify(chart));
          chartClone.key = 'delta';
          chartClone.values.forEach(function(item){
            console.log(item.label, $scope.ctrl.totals[item.label]);
            item.value =  -$scope.ctrl.originalTotals[item.label] + $scope.ctrl.totals[item.label];
            item.value =  $scope.ctrl.originalTotals[item.label];
          });
          $scope.data.push(chartClone);
          console.log('chartClone',chartClone);
        }  
*/
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
      var color = '#ff000030';
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
    $scope.data2 = [];
     }
  }
});

