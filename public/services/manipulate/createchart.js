angular.module('CreateCharts',[])
.factory('createCharts',function(){
  return {
    create:function(data, config){
      console.log('create chart', data[0]);
      return create(data, config);
    }
  }


  function create(data, config){
    if(!data.length)return;
    var chartByName={};
    data.forEach(function(chart){
      chartByName[chart.key] = chart;
    });
    for(var name in config) {
      createChart(chartByName['Wind'], name);
    };
    return data;



    function createChart(basedOn, name) {
      var source = config[name];

      var chart =  chartByName[name];
      if(!chartByName[name]){
        chart = { //todo rename variable
          key: name,
          yAxis: '1',
          color: source.color,
          type: 'area',
          values: [],
          seriesIndex: data.length
        };
      }
      var y = config[name].power;
      if((typeof(y) === 'number') && chart.values){
        chart.values.length = 0;
        basedOn.values.forEach(function(value) {
          chart.values.push({
            x: value.x,
            y: y
          });
        })
        if(data.indexOf(chart) === -1){
          if(chart.key === 'Curtailment'){
            data.unshift(chart);  //ugly workaround
          }
      
        }
        return chart
      }
    }
  }

});
