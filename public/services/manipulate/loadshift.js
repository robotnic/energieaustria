angular.module('LoadShift',[])
.factory('loadshift',function(){
  console.log('inside factory loadshift');
  var total = {};
  return {
    shift: shift,
    diff: diff
  }

  function diff(){
    return diffdata;
  }




  function shift(data, mm, mutation, sources, ctrl){
    var curtailmentChart=null;
    chartsByName={};
    data.forEach(function(chart){
      chartsByName[chart.key] = chart;
      if(chart.key === 'Curtailment') {
        curtailmentChart=chart;
      }
    });
    console.log('malzeit', mm, curtailmentChart);
    mm.loadShift.from.forEach(function(from){
      add(from, mutation, ctrl);
    });
    realShift2();
    return {
        data: data
    }


    function realShift2(){
      curtailmentChart.values.forEach(function(value,i){
        mm.loadShift.to.forEach(function(to){
          var minpower = sources[to].minpower || 0;
          if(chartsByName[to]) {
            var fossil = chartsByName[to].values[i];
            if(value.y < 0){
              var oldFossilY = fossil.y;
              if(value.y <= -fossil.y + minpower){
                fossil.y = minpower;
              }else{
                fossil.y = fossil.y + value.y;
              }
              var delta = oldFossilY - fossil.y;
              value.y += delta; 
            }
          }
        });
      });
    }

    function add(chartString, mutation, ctrl) { 
      var to = {}; 
      var type = chartString;
      var multiplier = 1; 
      if (ctrl.normalize[type]) { 
        multiplier = (mutation[type] * 1000 + ctrl.normalize[type]) / ctrl.normalize[type]; //not sure if correct 
      } 
      if (ctrl.normalize[type]) { 
        var found = null; 
        data.forEach(function(chart) { 
          if (mutation[chart.key]) { 
            found = true; 
            to[chart.key] = chart; 
          } 
        }); 
        for (var name in to) { 
          addRenewalbles(to[name], multiplier, curtailmentChart) 
        } 
      } 
    } 


    function addRenewalbles(chart, multiplier, Curtailment) {
      var total = 0;
      chart.values.forEach(function(value, i) {
        var oldValue = value.y;
        value.y = value.y * multiplier;
        var delta = value.y - oldValue;
        if (curtailmentChart.values[i]) {
          Curtailment.values[i].y -= delta;
        }
        total += delta;
      });
      if (total) {
        console.log('Unused Energie', chart.key, total, multiplier);
      }
    }

    function addToTotal(name, type, delta,i,x){
      if(!total[name]){
        total[name]={values:{}}
      }
      if(!total[name].values[x]){
        total[name].values[x] = 0;
      }
      total[name].values[x] += delta;
    }
  }
});
