angular.module('manipulate', [])

.factory('manipulator', function() {
      return {
        manipulate: function(data, mutate, sources) {
          return manipulate(data, mutate, sources);
        }

      }
      function manipulate(origdata, mutate, sources){
        console.log('-----sources----', sources);
        console.log('-----manipulate----', mutate);
        var data = JSON.parse(JSON.stringify(origdata));
        var Power2Gas = null;
        var meta = {
          free: {
            pump: 0,
            unused: 0
          },
          total: {},
          originalTotal: {}
        };
        data.forEach(function(chart){
          meta.originalTotal[chart.key]=calcTotal(chart);  //duration missing
        });
        data.forEach(function(chart){
              if(chart.key === 'Power2Gas') {
                Power2Gas = chart;
              }
        });
        data.forEach(function(chart){
              var multiplier = mutate[chart.key] || 1;
              addRenewalbles(chart, multiplier);
        });
        reduceFossiles();
        data.forEach(function(chart){
          meta.total[chart.key]=calcTotal(chart);
        });
        console.log(meta);
        return data;

        function calcTotal(chart){
          var total =0;
          chart.values.forEach(function(value){
            total += value.y;
          });
  //        $scope.total[chart.key]=total;
          /*
          if($scope.ctrl.timetype==='day'){
            total = total/4;
          }
          */
          return total;
        }


        function addRenewalbles(chart, multiplier) {
          var total = 0;
          chart.values.forEach(function(value, i) {
            var oldValue = value.y;
            value.y = value.y * multiplier;
            var delta = value.y - oldValue;
            if (Power2Gas.values[i]) {  
              Power2Gas.values[i].y -= delta ;
            }
            total += delta;
          });
          if (total) {
            console.log('Unused Energie', chart.key, total, multiplier, Power2Gas);
          }
        }

        function reduceFossiles(){
          var order  = ['Transport','Kohle', 'Öl', 'Gas'];
          for(var o in order) {
           data.forEach(function(chart){
              if(chart.key === order[o]) {
                console.log('reduce', chart);
                recudeCO2(chart);
              }
            });
            
          }
        }


        function recudeCO2(chart) {
          chart.values.forEach(function(value,i){
            var pg = Power2Gas.values[i];
            if (pg) {
              if(value.y > 0 && pg.y < 0) {
                console.log('bevor',value.y, -pg.y);
                var bigger = false;
                if(value.y > -pg.y){
                  bigger = true;
                  var oldY = value.y;
                  value.y = value.y + pg.y;
                  var delta = value.y - oldY;
                  pg.y = pg.y - delta;
                } else {
                  var delta = value.y;
                  value.y = 0;
                  pg.y = pg.y + delta;
                }
                console.log('after',value.y, -pg.y, bigger, delta);
              }
            }
          });
        }
      }

/*
      function alter(name, chart, factor, data, replace, meta){
        var rest = 0;
        var pumpChart = null;
        var replaceCharts={};
        //$scope.free[name]=0;
        data.forEach(function(replaceChart){
          replace.forEach(function(r){
            if(replaceChart.key === r){
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
              if(typeof(meta.free[r]) === 'undefined'){
                console.log('init free',r);
                meta.free[r]=0;
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
              meta.free[r]+=(oldDelta - delta);
            }
          
            //$scope.free[name]=+delta;
          if(delta !== 0){
            var xy=pumpChart.values[i];
            //console.log('Pumpit',new Date(xy.x), xy.y +' + '+delta+'='+(xy.y + delta));
            var maxpump=-1.9;
            //$scope.free[name]=+delta;
            if((xy.y + delta) > maxpump){
              xy.y = xy.y + delta;
              meta.free.pump += delta;
              delta= 0;
            }else{
              delta =   delta - maxpump; 
              meta.free.pump += delta;
              xy.y = maxpump;
              //console.log('overloa delta', delta,'already pumping', xy.y);
            }
          }
          if(delta !== 0){
            //console.log('hau weg', delta);
            //console.log('hau weg', p2gChart);
            if(delta>0)delta=0;
            p2gChart.values[i].y = delta;
            meta.free.unused += delta;
          }
          
        });
        return chart; 
      }
*/
});
