angular.module('installed', ['nvd3','energiecharts'])

.directive('installed', function() {
  return {
    scope:{
      year:'=',
    },
      template:`installed capacity {{year}}
<nvd3 options="options" data="installedcapacity" api="api"></nvd3>
`,
    controller: function($scope, dataManager, $q) {

      function loadYear(year){
        var installed = {
                key: year,
                values: [ ]
        }

        dataManager.getInstalled(year).then(function(response){
          console.log('installed',response);
          response.forEach(function(item){
            installed.values.push({
              label:item.Title,
              value:item.Value 
            });
            $scope.installedcapacity.push(installed);
          });
        });
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

