angular.module('manipulate', ["CreateCharts", "LoadShift", "TimeShift"])

  .factory('manipulator', function(loadshift, timeshift, createCharts) {
    return {
      manipulate: function(data, mutate, sources, surplus, ctrl) {
        console.log('mutate', data, sources);
        return mutateData(data, mutate, sources, surplus, ctrl);
      
      }

    }

    function mutateData(originalData, mutate, sources, surplus, ctrl) {
      console.log('-----------mutate createCharts', mutate);
      var data = JSON.parse(JSON.stringify(originalData));
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
      var viewInit = JSON.parse(JSON.stringify(data));
      var loadShiftedData = loadshift.shift(data, mm, mutate, sources, ctrl);
      return timeshift.shift(viewInit, loadShiftedData.data,  mm.config,mm.timeShift);
    }
  })

