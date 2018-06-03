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
console.log(ctrl);
    chartsByName={};
    data.forEach(function(chart){
      chartsByName[chart.key] = chart;
    });
    mm.loadShift.from.forEach(function(from){
      add(from, mutation, ctrl);
    });
    data.forEach(function(chart){
      chartsByName[chart.key] = chart;
    });
 
    realShift2();
    return {
        data: data
    }


    function realShift2(){
      chartsByName['Curtailment'].values.forEach(function(value,i){
        mm.loadShift.to.forEach(function(to){
          if(chartsByName[to]) {
            var minpower = 0;
            if(mm.config[to]){
              minpower = mm.config[to].min|| 0;
            }
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
console.log('ctrl',ctrl);
      var to = {}; 
      var type = chartString;
      var multiplier = 1; 
      if (ctrl.normalize[chartString]) { 
        multiplier = (mutation[chartString] * 1000 + ctrl.normalize[chartString]) / ctrl.normalize[chartString]; //not sure if correct 
      } 
      addRenewalbles(chartsByName[chartString], multiplier) 
    } 


    function addRenewalbles(chart, multiplier) {
      var total = 0;
      if(multiplier !== 1){
        chart.values.forEach(function(value, i) {
          var oldValue = value.y;
          value.y = value.y * multiplier;
          var delta = value.y - oldValue;
          if (chartsByName.Curtailment.values[i]) {
            chartsByName.Curtailment.values[i].y -= delta;
          }
          total += delta;
        });
      }
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
