angular.module('manipulate', ["CreateCharts", "LoadShift", "TimeShift"])

  .factory('manipulator', function(loadshift, timeshift, createCharts) {
    var data = null;
    var viewInit = null;
    var timeShiftedData = null;
    var timeShiftedDataByName = null;
    var allTotals = null;
    var callbacks = [];

    return {
      manipulate: manipulate,
      getOriginalData: getOriginalData,
      getModifiedData: getModifiedData,
      getTotals: getTotals,
      waitTotals: waitTotals,
      getFillLevels: getFillLevels
    }

    function manipulate(originalData, mutate, sources, ctrl) {
      console.log('---', originalData);
      data = JSON.parse(JSON.stringify(originalData));
      var mm = {
        loadShift:{
          "from":['Solar','Wind'],
          "to": ["Kohle","Transport","Gas", "Speicher", "Biomasse", "Pumpspeicher",  "Power2Gas"],
          "createCharts":["Delta","Füllstand"]
        },
        timeShift:{
          "from":["Pumpspeicher", "Speicher", "Biomasse"],
          "to": ["Transport","Kohle", "Gas"],
          "createCharts":["Delta"]
        }
      }

      mm.config = JSON.parse(JSON.stringify(sources));
      mm.config.Transport.power = mm.config.Transport.power * mutate.Transport /100;
      mm.config.Power2Gas.min = -mutate.Power2Gas;

      createCharts.create(data, mm.config);
      viewInit = JSON.parse(JSON.stringify(data));
      var loadShiftedData = loadshift.shift(data, mm, mutate, sources, ctrl);
      timeShiftedData = timeshift.shift(viewInit, loadShiftedData.data,  mm.config, mm.timeShift);
      console.log('tSD',timeShiftedData)
      callbacks.forEach(function(callback){
        callback(getTotals());
      });
      return timeShiftedData;
    }

    function getOriginalData(){
      return data;
    }

    function getModifiedData(){
      return timeShiftedData;
    }

    function waitTotals(callback){
      callbacks.push(callback);
    }

    function getTotals(){
      if(!data || !timeShiftedData.data)return;
      
      timeShiftedDataByName = {};
      console.log('---bring the totals---');
      timeShiftedData.data.forEach(function(chart){
        timeShiftedDataByName[chart.key] = chart;
      });
 
      var modified = {};
      var original = {};
      viewInit.forEach(function(chart,i){
        if(chart.type === 'area' && timeShiftedDataByName[chart.key]){
          var newChart= {
            in:0,
            out:0,
            delta:0,
            original:0,
            modified:0
          }
          chart.values.forEach(function(value,j){
            newChart.original += value.y
            newChart.modified += timeShiftedDataByName[chart.key].values[j].y
            newChart.delta += timeShiftedDataByName[chart.key].values[j].y - value.y
            if(value.y > 0){
              newChart.out += value.y
            }else{
              newChart.in += value.y
            }
          });
          if(newChart.delta){
            original[chart.key] = newChart;
          }
        }
      });
      allTotals = original;
      return original;
    }

    function getFillLevels(chartnames){
      var data = [];
      chartnames.forEach(function(chartname,i){
        var chart = getFillLevel(chartname);
        delete chart.seriesIndex;
        data.push(chart);
      });
      return data;
    }
    function getFillLevel(chartname){
      console.log(timeShiftedDataByName[chartname]);
      var modifiedChart = timeShiftedDataByName[chartname];
      var originalChart = null;
      viewInit.forEach(function(chart){
        if(chart.key === chartname){
          originalChart = chart;
        }
      });
      var newChart = JSON.parse(JSON.stringify(originalChart));
      console.log(originalChart, modifiedChart, newChart);
      var sum = 0;
      originalChart.values.forEach(function(value,i){
        var delta = value.y - modifiedChart.values[i].y;
        if(delta){
          sum += delta;
        }
        newChart.values[i].y = sum;
        if(newChart.values[i].y < 0.000001){
          newChart.values[i].y = 0;
        }
      });
      return newChart;
    }
  })

