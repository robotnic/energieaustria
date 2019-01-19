angular.module('installed', ['nvd3', 'energiecharts', 'totalinstalled'])

  .directive('installed', function () {
    return {
      scope: {
        ctrl: '=',
        mutate: '='
      },
      template: `<h2>Installed capacity </h2>
<nvd3 options="options" data="installeddata" api="api"></nvd3>
`,
      controller: function ($scope, dataManager, $q, totalInstalledFactory) {
        var installed = {};
        $scope.$watch('ctrl.date', function () {
          //        $scope.year = $scope.ctrl.date.substring(0,4);
          $scope.year = moment($scope.ctrl.date).year();
          $scope.ctrl.normalize = {
            Wind: 2696,
            Solar: 1031,
            Power2Gas: 0
          }
          if (installed[$scope.year] && installed[$scope.year]['Solar']) {
            $scope.ctrl.normalize.Solar = installed[$scope.year]['Solar'];
            $scope.ctrl.normalize.Wind = installed[$scope.year]['Wind'];
          }
        });

        function showData(a, sources) {
          console.log('iiiiiiiiiiiiiiiiii', sources );
          var data = [];
          var installedBar = [{
            "key": "Series1",
            "color": "#d62728",
            "values": [{
              "label": "Group A",
              "value": -1.8746444827653
            }]
          }]
          var collect={};
          for(var i in installed){
            for(var t in installed[i]){
                if (!collect[t]) {
                  collect[t] = {};
                }
                collect[t][i] = installed[i][t];
            }
          }
          for(var c in collect) {
            var color='red';
            if(sources[c]) {
              color = sources[c].color;
            }
            var item = {
              key: c,
              color: color,
              values:[]
            }
            for(var v in collect[c]) {
              item.values.push({
                label:v,
                value: collect[c][v]
              })
            }
            data.push(item);
          }
          $scope.installeddata = data;

        }

        function loadYear(year) {
          var q = $q.defer();
          var template = {
            key: year,
            values: []
          }

          dataManager.getInstalled(year).then(function (response) {
            response.forEach(function (item) {
              template.values.push({
                label: item.Title,
                value: item.Value
              });
              //nvd3
              $scope.installedcapacity.push(template);
              //simpler format
              if (!installed[year]) {
                installed[year] = {};
              }
              installed[year][item.Title] = item.Value;
            });
            q.resolve();
          });
          //very strange programming
          if (installed[$scope.year]) {
            console.log('gefunedn', installed[$scope.year]['Solar']);
            $scope.ctrl.normalize = {
              Solar: installed[$scope.year]['Solar'],
              Wind: installed[$scope.year]['Wind'],
              Power2Gas: 1
            }
            //$scope.mutate.normalizeWind = installed[$scope.year]['Wind'];
          }
          return q.promise;
        }
        console.log('load year');
        var promises =[];
        promises.push(loadYear('2018'));
        promises.push(loadYear('2017'));
        promises.push(loadYear('2016'));
        promises.push(loadYear('2015'));
        $q.all(promises).then(function(){
          dataManager.getSources().then(function(sources){
            showData($scope.installedcapacity, sources);
          })
        }, function(error) {
          console.log(error);
        })
        $scope.options = {
          chart: {
            type: 'multiBarHorizontalChart',
            showLegend: true, // to hide legend
            showControls: false, // to hide controls
            stacked:true,
            height: 550,
            width: 1250,
            margin: {
              top: 80,
              right: 20,
              bottom: 150,
              left: 155
            },
            x: function (d) {
              return d.label;
            },
            y: function (d) {
              return d.value + (1e-10);
            },
            showValues: true,
            valueFormat: function (d) {
              return d3.format(',.4f')(d);
            },
            duration: 500,
            xAxis: {
              rotateLabels: -45

            },
            yAxis: {
              axisLabel: 'Installed Capacity in GW',
              axisLabelDistance: -10
            }
          }
        }


        $scope.installedcapacity = []
      }
    }
  });