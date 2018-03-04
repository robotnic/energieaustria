angular.module('pie', ['nvd3', 'energiecharts'])

.directive('pie', function() {
    return {
      scope: {
        year: '=',
        type: '=',
        thetitle: '=',
        mutate: '=',
      },
      template: '<div><h3> <span ng-if="thetitle">{{thetitle}}</span> </h3><p>{{total}}; {{totalGWh}} TWh; ⌀{{power}}</p><nvd3 options="options" data="piedata" tooltipcontent="toolTipContentFunction()"></nvd3></div>',
      controller:'pieController'
    }
  }
)


.controller('pieController', function($scope, dataManager, $q) {
        $scope.$watch('mutate.Transport', function() {
          init();
        });
        init();

        function init() {
          dataManager.getSector($scope.type, $scope.year).then(function(sector) {
            $scope.piedata = [];
            var total = 0;
            var electric = null;
            for (var s in sector) {
              if(s === "Elektrische Energie"){
                electric = sector[s];
              }
            }
            for (var s in sector) {
              var y = sector[s]; // * 0.277777
              if ($scope.mutate && (s === 'Benzin' || s === 'Diesel')) {
                var delta = y;
                y = y * (1 - $scope.mutate.Transport / 100);
                delta -= y;
                sector["Elektrische Energie"]+=delta/4
              }
              $scope.piedata.push({
                key: s,
                y: y
              });
              total += y
            }
            $scope.toolTipContentFunction = function() {
              return 'asdfasf';
            }
            $scope.total = Math.round(total / 1000) + ' PJ';
            $scope.totalGWh = Math.round(total * 0.2777 / 1000);
            $scope.power = Math.round(total / 365 / 24 * 10 * 0.277) / 10 + ' GW';

            var height = Math.sqrt(parseInt($scope.totalGWh)) * 30 + 40;
            $scope.options = {
              chart: {
                type: 'pieChart',
                height: height,
                width: height,
                x: function(d) {
                  return d.key;
                },
                y: function(d) {
                  return d.y;
                },
                showLabels: true,
                duration: 500,
                labelThreshold: 0.01,
                labelSunbeamLayout: true,
                legend: {
                  margin: {
                    top: 5,
                    right: 35,
                    bottom: 5,
                    left: 0
                  }
                },
                showLegend: false,
                tooltip: {
                  contentGenerator: function(d) {
                    //                    return "<p>test</p>" + JSON.stringify(d)
                    var PJ = Math.round(d.data.y / 1000);
                    var TWh = Math.round(d.data.y * 0.000277778);
                    var GW = Math.round(d.data.y * 0.000277778 / 365 / 24 * 1000);
                    return '<h3>' + d.data.key + '</h3><p> ' + PJ + ' PJ</p><p> ' + TWh + ' TWh</p><p> ' + GW + ' GWØ</p>';
                  }
                }

              }
            };

          });
        }
  });
