angular.module('charts', ['nvd3','energiecharts'])

.directive('chart', function() {
  return {
    $scope:{
      ctrl:'=',
      mutate:'=',
    },
    template:'<nvd3 options="options" data="viewdata" api="api"></nvd3>',
    controller: function($scope, dataManager, $q) {
      $scope.free={
        pump:0,
        unused:0
      };
 
      console.log($scope.mutate);
      console.log($scope.api);
      $scope.ctrl.myDate=moment($scope.ctrl.date);
      //init();     
      $scope.reload = function(){
        init(null, true);
      }
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
      $scope.options = {
        chart: {
            type: 'multiChart',
            height: 650,
            margin : {
                top: 170,
                right: 0,
                bottom: 50,
                left: 70
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
          console.log($scope.data);
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
//          $scope.data.unshift(p2g);
          $scope.data.splice(1, 0, p2g);
          $scope.viewdata = manipulate($scope.data);
            //$scope.data = $scope.data.concat(charts);
          var hash = readHash();
          //legendStateChanged();
        },function(error){
          console.log(error);
        });
      }

      $scope.$watch('mutate',function(value){
        if(typeof($scope.data)!=='undefined'){
          $scope.viewdata = manipulate($scope.data);
          if($scope.api){
            $scope.api.update();
          }
          setHash();
        }
      },true);

      function manipulate(data){
        $scope.free={
          pump:0,
          unused:0
        };
        $scope.total={};
        $scope.originalTotal={};
      console.log(data); 
        data = JSON.parse(JSON.stringify(data));
        console.log('manipulate', data);
        data.forEach(function(chart){
          $scope.originalTotal[chart.key]=calcTotal(chart);
        });
        data.forEach(function(chart){
          for(var m in $scope.mutate){
            //$scope.originalTotal[m]=calcTotal(chart);
            if(chart.key === m){
              var value = $scope.mutate[m];
              console.log(chart.key, m, value);
              alter(m, chart, value, data,['Gas','Kohle','Öl','Speicher']);
            }
            //$scope.total[m]=calcTotal(chart);
          }
        });
        data.forEach(function(chart){
          $scope.total[chart.key]=calcTotal(chart);
        });
        return data;
      }

      function calcTotal(chart){
        var total =0;
        chart.values.forEach(function(value){
          total += value.y;
        });
//        $scope.total[chart.key]=total;
        if($scope.ctrl.timetype==='day'){
          total = total/4;
        }
        return total;
      }

      function alter(name, chart, factor, data, replace){
        var rest = 0;
        console.log(replace,data);
        var pumpChart = null;
        var replaceCharts={};
        //$scope.free[name]=0;
        data.forEach(function(replaceChart){
          replace.forEach(function(r){
            if(replaceChart.key === r){
              console.log('rC',r,replaceChart);
              replaceCharts[r]=replaceChart;
            }
          });
          if(replaceChart.key === 'Pumpspeicher'){
            pumpChart = replaceChart;
          };
          if(replaceChart.key === 'Power2Gas'){
            p2gChart = replaceChart;
          };
        });
        console.log(chart.values.length);
        chart.values.forEach(function(value,i){
          var newy = value.y * factor;
          var delta= value.y - newy;
          value.y = newy;
            for(var r in replaceCharts){ 
              if(typeof($scope.free[r]) === 'undefined'){
                console.log('init free',r);
                $scope.free[r]=0;
              } 
              var oldDelta = delta;
              //$scope.free[r]=+delta;
              var rv=replaceCharts[r].values[i];
              if((rv.y + delta) > 0){
                rv.y = rv.y + delta;
                delta =0;
              }else{
                delta +=rv.y; 
                rv.y = 0;
              }
              $scope.free[r]+=(oldDelta - delta);
            }
          
            //$scope.free[name]=+delta;
          if(delta !== 0){
            var xy=pumpChart.values[i];
            console.log('Pumpit',new Date(xy.x), xy.y +' + '+delta+'='+(xy.y + delta));
            var maxpump=-1.9;
            //$scope.free[name]=+delta;
            if((xy.y + delta) > maxpump){
              xy.y = xy.y + delta;
              $scope.free.pump += delta;
              delta= 0;
            }else{
              delta =   delta - maxpump; 
              $scope.free.pump += delta;
              xy.y = maxpump;
              console.log('overloa delta', delta,'already pumping', xy.y);
            }
          }
          if(delta !== 0){
            console.log('hau weg', delta);
            console.log('hau weg', p2gChart);
            if(delta>0)delta=0;
            p2gChart.values[i].y = delta;
            $scope.free.unused += delta;
          }
          
        });
        return chart; 
      }


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
