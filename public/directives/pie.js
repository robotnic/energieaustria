angular.module('pie', ['nvd3','energiecharts'])

.directive('pie', function() {
  return {
    scope:{
      year:'=',
      type:'=',
      title:'=',
    },
      template:'<div><h3> <span ng-if="!title">{{type}} </span> <span ng-if="title">{{title}}</span> </h3><p>{{total}}; {{totalGWh}} TWh; ⌀{{power}}</p><nvd3 options="options" data="piedata" tooltipcontent="toolTipContentFunction()"></nvd3></div>',
    controller: function($scope, dataManager, $q) {
      console.log("$scope.",$scope);
      dataManager.getSector($scope.type,$scope.year).then(function(sector){
        $scope.piedata=[];
        var total=0;
        for(var s in sector){
          var y = sector[s]; // * 0.277777
          $scope.piedata.push({
            key:s,
            y:y
          });
          total+=y
        }
        $scope.toolTipContentFunction = function(){
          return 'asdfasf';
        }
        $scope.total=Math.round(total/1000)+' PJ';
        $scope.totalGWh =Math.round(total*0.2777/1000);
        $scope.power =Math.round(total /365/24 *10 * 0.277)/10  + ' GW';
        var height = Math.sqrt(parseInt($scope.totalGWh)) *30 +40; 
        $scope.options = {
            chart: {
                type: 'pieChart',
                height: height,
                width: height,
                x: function(d){return d.key;},
                y: function(d){return d.y;},
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
                showLegend : false,
                tooltipContent: function(key){
                  return 'haha'
                }
            }
        };
        
      }); 
    }
  }
});

