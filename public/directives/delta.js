angular.module('delta', ['nvd3', 'energiecharts', 'manipulate'])

  .directive('delta', function() {
      return {
        scope: {
          ctrl: '=',
          totals: '=',
//            makeChart(totals, 'delta');
          sources: '='
        },
        template: '    <nvd3 options="options" data="data"></nvd3>',
        controller: function($scope, dataManager, $q, manipulator) {
          var colors={
            delta:'black',
            in:'green',
            original:'lightgrey',
            modified:'red',
          }
          $scope.$watch('ctrl', function() {
            start();
          }, true);

          function start() {
            manipulator.waitTotals(function(totals){
              $scope.data.length = 0;
              makeChart(totals, 'original');
              makeChart(totals, 'modified');
//              makeChart(totals, 'delta');
            });
          }


          function makeChart(totals, type) {
            var chart = {
              "key": type,
//              "color": colors[type],
              "values": []
            }
            var i = 0;
            for (var t in totals) {
              var total = totals[t];
              var delta = total[type];
//              if (delta && Math.abs(delta) > 0.00001 && $scope.sources[t]) {
              var color = 'green'; //$scope.sources[t].color || 'black';
              var value = {
                "label": t,
                "value": delta,
 //               "color": colors[type]
              }
              chart.values.push(value);
              i++;
            }
            $scope.data.push(chart);
        }
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
    $scope.options= {
     chart: {
                type: 'multiBarChart',
                height: 450,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 45,
                    left: 45
                },
                clipEdge: true,
                duration: 500,
                //stacked: true,
            x: function(d) {
              return d.label;
            },
            y: function(d) {
              return d.value;
            },
 
                xAxis: {
                    showMaxMin: false,
                    tickFormat: function(d){
                        return d; //3.format(',f')(d);
                    }
                },
                yAxis: {
                    axisLabel: 'GWh',
                    axisLabelDistance: -20,
                    tickFormat: function(d){
                        return d3.format(',.1f')(d);
                    }
                }
            }
          }


        $scope.options2 = {
          chart: {
            type: 'discreteBarChart',
            "stacked": true,

            height: 450,
            width: 850,
            margin: {
              left: 150,
              bottom: 150
            },
            x: function(d) {
              return d.label;
            },
            y: function(d) {
              return d.value;
            },
            //yErr: function(d){ return [-Math.abs(d.value * Math.random() * 0.3), Math.abs(d.value * Math.random() * 0.3)] },
            showControls: true,
            showValues: true,
            duration: 500,
            xAxis: {
              showMaxMin: false,
              rotateLabels: -45
            },
            yAxis: {
              axisLabel: 'GWh',
              tickFormat: function(d) {
                return d3.format(',.2f')(d);
              }
            },
            color: function(a) {
              return color(a);
            }

          }
        };

        function color(a) {
          var color = '#ff000070';
          if (a.series === 0) {
            color = '#00000030';
          } else {
            if ($scope.sources && $scope.sources[a.label]) {
              color = $scope.sources[a.label].color;
            }
          }
          return color;
        }

        $scope.data = [];
      }
    }
  });
