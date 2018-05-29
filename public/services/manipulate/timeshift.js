"use strict"; 

angular.module('TimeShift',[])
.factory('timeshift',function(){
  console.log('inside factory loadshift');
  return {
    shift:shift
  }

  function shift(originalData, viewdata, config, plan){
    console.log('config',plan);
    var originalByName = {};
    var viewdataByName = {};
    originalData.forEach(function(chart){
      originalByName[chart.key] = chart;
    });
    viewdata.forEach(function(chart){
      viewdataByName[chart.key] = chart;
    });
 
    plan.to.forEach(function(toName){
      plan.from.forEach(function(fromName){
        //console.log(fromName,'---->', toName);
        movePower(originalByName[fromName], viewdataByName[fromName], viewdataByName[toName]);
      });
    });
    return {data: viewdata}

    function movePower(origFromChart, newFromChart, newToChart){
      var freeEnergy = 0;
      origFromChart.values.forEach(function(value,i){
        var delta = value.y - newFromChart.values[i].y; 
        freeEnergy += delta;
        if(newToChart.values[i].y > 0 && freeEnergy > 0){
          var origY = newToChart.values[i].y;
          //  console.log(delta, freeEnergy, origY, config[origFromChart.key].max);
          var maxPower = config[origFromChart.key].max;

          var shiftPower = freeEnergy; //newToChart.values[i].y;
          if(shiftPower > maxPower){
            shiftPower = maxPower;
          }
          newToChart.values[i].y -= shiftPower;
          if(newToChart.values[i].y < 0){
            newToChart.values[i].y = 0;
          }
 
          var newDelta = origY - newToChart.values[i].y; 
          newFromChart.values[i].y += newDelta;
          //console.log(shiftPower, newDelta, freeEnergy, origY,newFromChart.values[i].y, config[origFromChart.key].max);
          freeEnergy -= newDelta;
        }
      });
      return freeEnergy;
    }
  }
});
