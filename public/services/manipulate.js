angular.module('manipulate', [])

.factory('manipulator', function() {
      return {
        manipulate: function(data, mutate, sources, surplus, timetype) {
          return manipulate(data, mutate, sources, surplus, timetype);
        }

      }
      function manipulate(origdata, mutate, sources, surplus, timetype){
        console.log(mutate);
        var data = JSON.parse(JSON.stringify(origdata));
        var Power2Gas = null;
        var Pumpspeicher = null;
        var EV = null;
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
              if(chart.key === 'Power2Gas') {
                Power2Gas = chart;
              }
              if(chart.key === 'Pumpspeicher') {
                Pumpspeicher = chart;
              }
 
        });
        data.forEach(function(chart){
          if (chart.type === 'area') {
            originalTotals[chart.key]=calcTotal(chart);  //duration missing
            if(chart.key === 'Pumpspeicher'){
              originalTotals['pump up']=calcUpDown(chart,'up');
              originalTotals['pump down']=calcUpDown(chart,'down');
            }
            if(chart.key === 'Transport'){
//              originalTotals['Transport']= 4* mutate.Transport ;
            }
   
          }
        });
 
        data.forEach(function(chart){
          if (chart.type === 'area') {
              var multiplier = mutate[chart.key] || 1;
              if(chart.key === 'Solar'){
                multiplier = (mutate[chart.key] * 1000  + mutate.normalizePV ) / mutate.normalizePV;
                console.log('Multiplier Solar', multiplier, mutate.Solar, mutate.normalizePV);
              }
              if(chart.key === 'Wind'){
                multiplier = (mutate[chart.key] * 1000 + mutate.normalizeWind ) / mutate.normalizeWind;
                console.log('Multiplier Wind', multiplier, mutate.Wind);
              }
              addRenewalbles(chart, multiplier);
              if(chart.key === 'Transport') {
                addEV(chart);
              }
          }
        });
        reduceFossiles();
        console.log('surplus before pump', surplus);
        pump(surplus);
//        releaseExcess();
        console.log('totals',totals);
        data.forEach(function(chart){
          if (chart.type === 'area') {
            totals[chart.key]=calcTotal(chart);
          }
          if(chart.key === 'Pumpspeicher'){
            totals['pump up']=calcUpDown(chart,'up');
            totals['pump down']=calcUpDown(chart,'down');
          }
        });
        pumpsurplus = totals['Pumpspeicher'] - originalTotals['Pumpspeicher'];
        console.log('PUMPSURPLUS',pumpsurplus);
        return {
          data: data,
          totals: totals,
          originalTotals: originalTotals,
          pumpsurplus: pumpsurplus
        }

        function calcUpDown(chart,direction){
          var total = 0;
          chart.values.forEach(function(value){
            if(direction === 'up' && value.y < 0){
              total += value.y;
            }
            if(direction === 'down' && value.y > 0){
              total += value.y;
            }
 
          });
          if(timetype === 'day'){
            total = total /4;
          }
          console.log('-----------',total);
          return total;
        }

        function addEV(EV){
          EV.values.forEach(function(value){
            value.y = 4 * mutate.Transport /100;  //4GW continues for all transport (guess)
          });
        }

        function calcTotal(chart){
          var total = 0;
          chart.values.forEach(function(value){
            total += value.y;
          });
  //        $scope.total[chart.key]=total;
          /*
          if($scope.ctrl.timetype==='day'){
            total = total/4;
          }
          */
          if(timetype === 'day'){
            total = total /4;
          }
          return total;
        }

        function pump(surplus) {
          var total=0;
          if(surplus){
            total = surplus;
            console.log('set total', total);
          }
          var totalPG=0;
          data.forEach(function(chart){
            if(chart.key === 'Pumpspeicher') {
              //console.log('pump', chart);
              var minpower = sources[chart.key].minpower;
              var maxpower = sources[chart.key].maxpower;
              //console.log(minpower, maxpower);
              chart.values.forEach(function(value,i){
                var pg = Power2Gas.values[i];
//                console.log('old', value.y, pg.y);
                //console.log(value.y,pg.y,i);
                //console.log('before', value.y, pg.y, 'total:',total);
                var oldY = value.y;
                var sum = value.y + pg.y;
                if(sum < minpower) {
                  sum = minpower;
                }

                value.y = sum;
                var delta = value.y - oldY;
                total += delta;
                pg.y = pg.y - delta;
                totalPG += pg.y;

                //release
                if(total < 0){
                  //console.log('total additional pumped', total);
                  total = release(i, total);
                  //console.log('after', value.y, pg.y, 'total:',total);
                }
              });
            }
          });
          return total; 
        }

        function release(i, total){
          var order  = ['Transport','Kohle', 'Öl', 'Gas'];
          for(var o in order) {
            data.forEach(function(chart){
              if(chart.key === order[o] && chart.values[i].y > 0) {
                var delta = total;
                if(chart.values[i].y < total) {
                  chart.values[i].y += total;
                  total = 0;
                } else {
                  delta = chart.values[i].y;
                  chart.values[i].y = 0;
                  total += delta;
                }
                Pumpspeicher.values[i].y += delta;
              }
            });
          }
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
        }
      }

});
