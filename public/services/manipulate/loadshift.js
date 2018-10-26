angular.module('LoadShift',['totalinstalled'])
.factory('loadshift',function(totalInstalledFactory){
  console.log('inside factory loadshift');
  var total = {};
  var money = {};
  return {
    shift: shift,
    diff: diff
  }

  function diff(){
    return diffdata;
  }




  function shift(data, mm, mutation, sources, ctrl){
    ctrl.money = {};
    ctrl.averagePrice = {};
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
      var to = {}; 
      var type = chartString;
      var multiplier = 1; 
      var norm = totalInstalledFactory.normalized(ctrl.date, chartString);
      multiplier = (mutation[chartString]  + norm) / norm; //not sure if correct 
      console.log(chartString, multiplier, norm);
      addRenewalbles(chartsByName[chartString], multiplier) 
    } 


    function addRenewalbles(chart, multiplier) {
      var totalValue = 0;
      var moneyValue = 0;;
      if(multiplier !== 1){
        chart.values.forEach(function(value, i) {
          var oldValue = value.y;
          //var norm = totalInstalledFactory.normalized(ctrl.date, chart.key);
          //var multiplier = (mutation[chart.key]  + norm) / norm;
          value.y = value.y * multiplier; //totalInstalledFactory.normalized(ctrl.date, chart.key);     //multiplier;
          var delta = value.y - oldValue;
          if (chartsByName.Curtailment.values[i]) {
            chartsByName.Curtailment.values[i].y -= delta;
          }
          totalValue += delta;
          if (chartsByName['Preis [EUR/MWh]'] && chartsByName['Preis [EUR/MWh]'].values[i].y > 0) {
            moneyValue += delta * chartsByName['Preis [EUR/MWh]'].values[i].y;
          }
        });
      }
      if (totalValue) {
        console.log('Unused Energie', chart.key, totalValue, multiplier);
      }
      ctrl.money[chart.key] = moneyValue * 1000;
      ctrl.averagePrice[chart.key] = moneyValue / totalValue;
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
