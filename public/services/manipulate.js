angular.module('manipulate', [])

  .factory('manipulator', function() {
    return {
      manipulate: function(data, mutate, sources, surplus, ctrl) {
        return mutate2(data, mutate, sources, surplus, ctrl);
      }

    }

    function mutate2(originalData, mutate, sources, surplus, ctrl) {
      console.log('-----------mutate data', mutate);
      var data = JSON.parse(JSON.stringify(originalData));
      var totals = [];
      var total = {}
      var originalTotals = [];
      var pumpsurplus = [];
      var m = {
        "title": "add renewable",
        "mutations": [{
            "add": {
              "type": "Solar",
              "GWp": mutate.Solar
            },
            "to": ["curtailment"]
          },
          {
            "add": {
              "type": "Wind",
              "GWp": mutate.Wind
            },
            "to": ["curtailment"]
          },
          {
            "from": "curtailment",
            "to": ["Kohle", "Gas", "Transport", "curtailment"]
          },
          {
            "from": "curtailment",
            "to": ["Speicher", "curtailment"]
          },
          {
            "from": "curtailment",
            "to": ["Pumpspeicher", "curtailment"]
          },
          {
            "from": "curtailment",
            "to": ["Power2Gas"]
          }
        ]
      }
      m.mutations.forEach(function(mutation) {
        createMissingCharts(mutation);
      });
      data.forEach(function(chart) {
        calcTotal(chart, 'original');
      });
      m.mutations.forEach(function(mutation) {
        data.forEach(function(chart) {
          if (chart && mutation.add && chart.key === mutation.add.type) {
            console.log('-----------------------ADD ' + chart.key + '------------------------');
            add(chart, mutation);
          }
          if (chart && mutation.from === chart.key) {
            from(chart, mutation);
          }

        });
      });


      function from(chart, mutation) {
        var from = null;
        var to = {};
        mutation.to.forEach(function(name) {
          to[name] = {};
        });
        data.forEach(function(chart) {
          if (mutation.from === chart.key) {
            from = chart;
          }
          if (to[chart.key]) {
            console.log('...doch');
            to[chart.key] = chart;
          }
          if(!total[chart.key]){
            total[chart.key] = {};
          }
        });
        data.forEach(function(chart) {
          if (chart.key === mutation.from) {
            mutation.to.forEach(function(name) {
              if (sources[name]) {
                var minpower = sources[name].minpower || 0;
                chart.values.forEach(function(value, i) {
                  var delta = to[name].values[i].y
                  if (to[name].values) {
                    if (value.y < 0) {
                      to[name].values[i].y += value.y;
                      if (to[name].values[i].y < minpower) {
                        to[name].values[i].y = minpower;
                      }
                    }
                  } else {
                    //todo
                  }
                  delta -= to[name].values[i].y
                  addToTotal(name,'delta',delta);
                  from.values[i].y += delta;
                });
              }
            });
          }
          calcTotal(chart, 'modified');
        });
        console.log("TOTAL", total);

        function addToTotal(name, type, delta){
          if(!total[name]){
            total[name]={}
          }
          if(!total[name][type]){
            total[name][type] = 0;
          }
 
          total[name][type] += delta;
        }
      }

      function calcTotal(chart, prop){
        if(chart.type !== 'area')return;
        if(!total[chart.key]){
          total[chart.key] = {}
        }
        if(!total[chart.key][prop]){
          total[chart.key][prop] = {
            input:0,
            output:0,
            sum:0,
          };
        }

        var subtotal = 0;
        var input = 0;
        var output = 0;

        chart.values.forEach(function(value){
          subtotal += value.y;
          if(value.y < 0){
            input += value.y
          } else {
            output += value.y
          }
        });
        if(ctrl.timetype === 'day'){
          subtotal = subtotal /4;
          input = input /4;
          output = output /4;
        }
        total[chart.key][prop].sum = subtotal;
        total[chart.key][prop].input = input;
        total[chart.key][prop].output = output;
        return total;

      }


      function add(chart, mutation) {
        var to = {};
        var type = mutation.add.type;
        console.log('ctrl', ctrl);
        console.log('mut type', type, mutate, ctrl.normalize[type]);
        var multiplier = 1;
        if (ctrl.normalize[type]) {
          multiplier = (mutation.add.GWp * 1000 + ctrl.normalize[type]) / ctrl.normalize[type]; //not sure if correct
          console.log('====plutimikation====', type, multiplier);
        }
        if (ctrl.normalize[type]) {
          console.log('mutttt', mutation.add, mutation.to, multiplier);
          var found = null;
          data.forEach(function(chart) {
            if (mutation.to.indexOf(chart.key) !== -1) {
              console.log("beeindruckend");
              found = true;
              to[chart.key] = chart;
            }
          });
          /*
          if (!found) {
            mutation.to.forEach(function(name) {
              var newChart = createChart(chart, name);
              to[name] = newChart;
            });
          }
          */
          console.log('TO', to);
          for (var name in to) {
            console.log('NAME', name);
            addRenewalbles(chart, multiplier, to[name])
          }
        }
      }

      function createMissingCharts(mutation){
        var chartKeys=[];
        chartKeys.push(mutation.from);
        chartKeys = chartKeys.concat(mutation.to);
//        console.log(chartKeys);
        for(var c=data.length-1; c>=0;c--){
          var chart = data[c];
          var index = chartKeys.indexOf(chart.key);
          if(index !== -1) {
            //console.log('gibt es schon '+ chart.key, index);
            chartKeys.splice(index, 1);
          }
        };
        console.log("chartKeys",chartKeys, sources);
        chartKeys.forEach(function(name){
          console.log(name);
          if(name && sources){
            console.log('ccc',name);
            createChart(data[0],name);
          }
        });
      }

      function createChart(basedOn, name) {
        var source = sources[name];
        console.log('create', name, source);
        var values = [];
        var y = 0;
        if (name === 'Transport') {
          y = 4;
        }
        basedOn.values.forEach(function(value) {
          values.push({
            x: value.x,
            y: y
          });
        })
        var p2g = { //todo rename variable
          key: name,
          yAxis: '1',
          color: source.color,
          type: 'area',
          values: values,
          seriesIndex: data.length
        };
        if (name === 'curtailment') {
          console.log('-----------------------kurt----------------');
          data.splice(2, 0, p2g);
        } else {
          data.push(p2g);
        }
        return p2g
      }

      function addRenewalbles(chart, multiplier, Power2Gas) {
        var total = 0;
        chart.values.forEach(function(value, i) {
          var oldValue = value.y;
          value.y = value.y * multiplier;
          var delta = value.y - oldValue;
          if (Power2Gas.values[i]) {
            Power2Gas.values[i].y -= delta;
          }
          total += delta;
        });
        if (total) {
          console.log('Unused Energie', chart.key, total, multiplier);
        }
      }
      return {
        data: data,
        totals: total,
        originalTotals: originalTotals,
        pumpsurplus: pumpsurplus
      }

    }
  })
