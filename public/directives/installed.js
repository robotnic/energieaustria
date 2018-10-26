angular.module('installed', ['nvd3','energiecharts', 'totalinstalled'])

.directive('installed', function() {
  return {
    scope:{
      ctrl:'=',
      mutate:'=',
    },
      template:`installed capacity {{year}}
<nvd3 options="options" data="installedcapacity" api="api"></nvd3>
`,
    controller: function($scope, dataManager, $q, totalInstalledFactory) {
      var installed = {};
      $scope.$watch('ctrl.date',function(){
//        $scope.year = $scope.ctrl.date.substring(0,4);
        $scope.year = moment($scope.ctrl.date).year();
        $scope.ctrl.normalize ={
          Wind:  2696,
          Solar: 1031,
          Power2Gas: 0
        }
        if(installed[$scope.year] && installed[$scope.year]['Solar']){
          $scope.ctrl.normalize.Solar = installed[$scope.year]['Solar'];
          $scope.ctrl.normalize.Wind = installed[$scope.year]['Wind'];
        }
      });

      function loadYear(year){
        var template = {
                key: year,
                values: [ ]
        }

        dataManager.getInstalled(year).then(function(response){
          response.forEach(function(item){
            template.values.push({
              label:item.Title,
              value:item.Value 
            });
            //nvd3
            $scope.installedcapacity.push(template);
            //simpler format
            if(!installed[year]){
              installed[year] = {};
            }
            installed[year][item.Title] = item.Value;
          });
        });
        if(installed[$scope.year]){
          console.log('gefunedn',installed[$scope.year]['Solar']);
          $scope.ctrl.normalize ={
            Solar : installed[$scope.year]['Solar'],
            Wind : installed[$scope.year]['Wind'],
            Power2Gas : 1
          }
          //$scope.mutate.normalizeWind = installed[$scope.year]['Wind'];
        }
      }
      console.log('load year');
      loadYear('2017');
      loadYear('2016');
      loadYear('2015');
      $scope.options = {
          chart: {
              type: 'multiBarHorizontalChart',
    showLegend: false, // to hide legend
    showControls: false, // to hide controls
              height: 1250,
              width: 1250,
              margin : {
                  top: 20,
                  right: 20,
                  bottom: 150,
                  left: 155
              },
              x: function(d){return d.label;},
              y: function(d){return d.value + (1e-10);},
              showValues: true,
              valueFormat: function(d){
                  return d3.format(',.4f')(d);
              },
              duration: 500,
              xAxis: {
                  rotateLabels:-45

              },
              yAxis: {
                  axisLabel: 'Installed Capacity in GW',
                  axisLabelDistance: -10
              }
          }
      }


      $scope.installedcapacity = [ ]
    }
  }
});

