angular.module('manipulate', ["CreateCharts", "LoadShift", "TimeShift"])

  .factory('manipulator', function(loadshift, createCharts) {
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
        config:{
          "Pumpspeicher":{
            "min":-1.9,
            "max":4
          },
          "Speicher":{
            "min":0,
            "max":2
          },
          "Power2Gas":{
            "min":0,
            "max":2,
            "power":0
          },
          "Transport":{
            "EV":0.5,
            "power":0
          },
          "Power2Heat":{
            "power":0
          },
          "Solar":{
            "add":10
          },
          "Wind":{
            "add":1
          },
          "Curtailment":{
            "min":-10000000000,
            "power":0
          }
        },

        loadShift:{
          "from":['Solar','Wind'],
          "to": ["Kohle","Gas", "Transport", "Speicher", "Biomasse", "Pumpspeicher",  "Power2Gas"],
          "createCharts":["Delta","Füllstand"]
        },
        timeShift:{
          "from":["Speicher","Pumpspeicher", "Biomasse"],
          "to": ["Kohle", "Gas", "Transport"],
          "createCharts":["Delta"]
        }
      }
      console.log("sources", sources);
      createCharts.create(data, mm.config);
      return loadshift.shift(data, mm, mutate, sources, ctrl);
    }
  })

