angular.module('charts', ['nvd3','energiecharts','manipulate'])

.directive('chart', function() {
  return {
    $scope:{
      ctrl:'=',
      mutate:'=',
    },
    template:'<nvd3 options="options" data="viewdata" api="api"></nvd3><table><tr><th></th><th>Original GWh</th><th>Delta GWh</th></tr><tr ng-repeat="(k,v) in totals"><td>{{k}}</td> <td>{{originalTotals[k]| number : 1}}</td><td>{{v - originalTotals[k]| number : 1}}</td><td>{{v| number : 1}}</td></table>',
    controller: function($scope, dataManager, $q, manipulator) {
      $scope.free={
        pump:0,
        unused:0
      };
 
      $scope.ctrl.myDate=moment($scope.ctrl.date);
      //init();     
      $scope.reload = function(){
        init(null, true);
      }

      
      //time navigation

      $scope.$watch('ctrl',function(newvalue, oldvalue, scope){
        if(newvalue.myDate){
          var date=moment($scope.ctrl.myDate).startOf($scope.ctrl.timetype);
          DateString=moment(date).format('YYYYMMDD');
          
          if($scope.ctrl.date !== DateString){
            $scope.ctrl.date=DateString;
            init(DateString);
          }

          switch($scope.ctrl.timetype){
            case 'day':
              $scope.ctrl.titledate = moment($scope.ctrl.date).format('YYYY MMM DD');
              break;
            case 'week':
              var from=moment($scope.ctrl.date).startOf($scope.ctrl.timetype);
              var to=moment($scope.ctrl.date).endOf($scope.ctrl.timetype);
              if(from.format('MMM') === to.format('MMM')){
                $scope.ctrl.titledate = from.format('YYYY') + ' ' + from.format('MMM') + ' ' + from.format('DD') + '  - ' +to.format('DD');;
              }else{
                $scope.ctrl.titledate = from.format('YYYY') + ' ' + from.format('MMM') + ' ' + from.format('DD') + '  - ' + to.format('MMM') + ' '  +to.format('DD');;
              }
              break;
            case 'month':
              var from=moment($scope.ctrl.date);
              $scope.ctrl.titledate = from.format('YYYY') + ' ' + from.format('MMM');
              break;
            default:
              $scope.ctrl.titledate = 'loading...';
          

          }
        }
      },true);

      
      //nvd3

      $scope.options = {
        chart: {
            type: 'multiChart',
            height: 650,
            margin : {
                top: 170,
                right: 30,
                bottom: 100,
                left: 30
            },
            color: d3.scale.category10().range(),
            //useInteractiveGuideline: true,
            duration: 0,
            xAxis: {
              ticks:8,
              showMaxMin: false,
              tickFormat: function(d) {
                var t=0;
                switch($scope.ctrl.timetype){
                  case 'day':
                    t= moment(d).format('HH:mm');  //d3.time.fmt(rmat('%x')(new Date(d))
                    break;
                  case 'week':
                    t= moment(d).format('ddd DD.MMM.YYYY HH:mm');  //d3.time.fmt(rmat('%x')(new Date(d))
                    break;
                  default:
                    t= moment(d).format('ddd DD.MMM.YYYY');  //d3.time.fmt(rmat('%x')(new Date(d))
                }
              return t;
                //return d3.time.fmt(rmat('%x')(new Date(moment(d).format('DD.MMM HH:mm'))));
              },
              rotateLabels: 20,
            },
            yAxis1: {
                tickFormat: function(d){
                    return d3.format(',.1f')(d);
                }
            },
            yAxis2: {
                tickFormat: function(d){
                    return d3.format(',.1f')(d);
                }
            },
            legend: {
              dispatch: {
                  stateChange: function(e) {
                    legendStateChanged();
                  }
              }
            },
            tooltip: {
              contentGenerator: function(d) { 
                var yValue = d.series[0].value;
                if(d.series[0].values){
                  d.series[0].values.forEach(function(value){
                    if(value.x === d.value){
                      yValue=value.display.y;
                    }
                  });
                }
                var name = d.series[0].key;
                var time = moment(d.point.x).format('MMMM Do YYYY, HH:mm');
                return time + '<h3>' + name + ': ' + yValue + '</h3>';
              }
            }

        }
      };

      //load charts

      function init(dateString, reload){
        console.log('--init--', $scope.ctrl.layercode, dateString);
        var date = $scope.ctrl.date;
        setHash();
        if(dateString){
          date = dateString;
        }
        $scope.data = [];
        var promises = [
          dataManager.loadData('AGPT',date , 1,$scope.ctrl.timetype,'area', null,reload),
          dataManager.loadData('AL', date,1,$scope.ctrl.timetype,'line',null, reload),
          dataManager.loadData('EXAAD1P', date,2,$scope.ctrl.timetype,'line',  function(y){            
            return y*1000;
          }, reload)
        ];

        $q.all(promises).then(function(result){
          result.forEach(function(list){
            $scope.data = $scope.data.concat(list);
          })
          $scope.sources = dataManager.getSources();
          var values=[];
          $scope.data[0].values.forEach(function(value){
            values.push({x:value.x,y:0});
          })
          var p2g = {
            key:'Power2Gas',
            yAxis: '1',
            color: 'pink',
            type: 'area',
            values: values,
            seriesIndex: $scope.data.length
          };
          var transport = {
            key:'Transport',
            yAxis: '1',
            type: 'area',
            values: JSON.parse(JSON.stringify(values)),
            seriesIndex: $scope.data.length
          };
          transport.values.forEach(function(value){
            if(value){
            value.y = -4 * $scope.mutate.Transport/100;   //4GW für Transport - reiner Schätzwert
            }
          });

          $scope.data.splice(1, 0, p2g);
//          $scope.data.push(transport);
          var manipulationResult = manipulator.manipulate($scope.data, $scope.mutate, $scope.sources);   //here the manipulation happens
          $scope.viewdata = manipulationResult.data;
          $scope.totals = manipulationResult.totals;
          $scope.originalTotals = manipulationResult.originalTotals;
          var hash = readHash();
        },function(error){
          console.log(error);
        });
      }

      //watch manipulation

      $scope.$watch('mutate',function(value){
        if(typeof($scope.data)!=='undefined'){
          var manipulationResult = manipulator.manipulate($scope.data, $scope.mutate, $scope.sources);   //here the manipulation happens
          $scope.viewdata = manipulationResult.data;
          $scope.totals = manipulationResult.totals;
          if($scope.api){
            $scope.api.update();
          }
          setHash();
        }
      },true);


      //Deeplinking

      function legendStateChanged(){
        var legendState = {};
        $scope.ctrl.layercode = '';
        $scope.viewdata.forEach(function(item) {
          legendState[item.key]=item.disabled;
           if (item.disabled){
            $scope.ctrl.layercode += "0";
          }else{
            $scope.ctrl.layercode += "1";
          }

        });
        setHash();
      }

      function setHash(){
        var code = $scope.ctrl.layercode || '';
        var mutateString=';'
        for(var m in $scope.mutate){
          mutateString = mutateString + m + '=' + $scope.mutate[m] + '&';
        }; 
        mutateString = mutateString.slice(0, -1);
        location.hash=moment($scope.ctrl.myDate).format('YYYY-MM-DD', 'eb', true)+';'+$scope.ctrl.timetype + ';' + code + mutateString;
      }

      function readHash(){
        var layercode= $scope.ctrl.layercode + '';
        for(var i = 0; i< layercode.length;i++){
          if($scope.ctrl.layercode[i] === '0' && $scope.viewdata[i]){
            $scope.viewdata[i].disabled = true;
          }
        }
      } 
    }

  }
});
