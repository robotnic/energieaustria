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
        var originalTotals = {};
        var totals = {};
        data.forEach(function(chart){
          if (chart.type === 'area') {
            originalTotals[chart.key]=calcTotal(chart);  //duration missing
          }
        });
        data.forEach(function(chart){
              if(chart.key === 'Power2Gas') {
                Power2Gas = chart;
              }
        });
        data.forEach(function(chart){
          if (chart.type === 'area') {
              var multiplier = mutate[chart.key] || 1;
              addRenewalbles(chart, multiplier);
          }
        });
        reduceFossiles();
        pump();
        releaseExcess();
        console.log('totals',totals);
        data.forEach(function(chart){
          meta.total[chart.key]=calcTotal(chart);
        });
        console.log(meta);
        return {
          data: data,
          totals: totals,
          originalTotals: originalTotals
        }

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

        function pump() {
          var total=0;
          data.forEach(function(chart){
                if(chart.key === 'Pumpspeicher') {
                  console.log('pump', chart);
                  var minpower = sources[chart.key].minpower;
                  var maxpower = sources[chart.key].maxpower;
                  console.log(minpower, maxpower);
                  chart.values.forEach(function(value,i){
                    var pg = Power2Gas.values[i];
                    //console.log(value.y,pg.y,i);
                    var oldY = value.y;
                    var sum = value.y + pg.y;
                    if(sum < minpower) {
                      sum = minpower;
                    }
                    value.y = sum;
                    pg.y = 0; //sum + oldY;
                    var delta = value.y - oldY;
                    total += delta;
                    //console.log(sum);
                  });
                  totals[chart.key] = total;  //total
                }
          });
          return total; 
        }
        function releaseExcess() {

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
          totals[chart.key] = total;
        }

        function reduceFossiles(){
          var order  = ['Transport','Kohle', 'Öl', 'Gas','Speicher'];
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
          var total = 0;
          chart.values.forEach(function(value,i){
            var delta = 0;
            var pg = Power2Gas.values[i];
            if (pg) {
              if(value.y > 0 && pg.y < 0) {
                var bigger = false;
                if(value.y > -pg.y){
                  bigger = true;
                  var oldY = value.y;
                  value.y = value.y + pg.y;
                  delta = value.y - oldY;
                  pg.y = pg.y - delta;
                } else {
                  delta = value.y;
                  value.y = 0;
                  pg.y = pg.y + delta;
                }
    
              }
            }
            total += delta;
          });
          totals[chart.key] = -total;
        }
      }

});
