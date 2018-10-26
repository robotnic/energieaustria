angular.module('filllevel', ['nvd3','energiecharts','manipulate'])

.directive('filllevel', function() {
  return {
    scope:{
      ctrl:'=',
      mutate:'=',
      activeTab:'=',
      viewdata:'=',
      origdata:'=',
      data:'='
    },
    template:'<br/><nvd3 options="options" data="fillLevels" api="api"></nvd3>',
    controller: function($scope, dataManager, $q, manipulator) {
      //nvd3
      /*
      var year = moment($scope.ctrl.date).format('YYYY');
      dataManager.getFillLevel(year).then(function(hydro){
        console.log('hydro',hydro);
        hydro.type = 'line';
        hydro.yAxis = 1;
//        $scope.fillLevels = [hydro];
        init(hydro);
      });
      */

      function init(){
        var year = moment($scope.ctrl.date).format('YYYY');
        dataManager.getFillLevel(year,[
          {name:'Pumpspeicher',factor:0.4,color:'red'},
          {name:'Speicher',factor:0.6,color:'blue'},
//          {name:'Biomasse',factor:0,color:'blown'},
//          {name:'Power2Gas',factor:0,color:'lightblue'}
        ]).then(function(charts) {
          $scope.origFillLevels = charts;
          console.log('origFillLevels',$scope.origFillLevels);
          //$scope.fillLevels = charts;
        });
      } 
      init();

      $scope.$watch('viewdata',function(){
          console.log('origFillLevels2',$scope.origFillLevels);
        $scope.fillLevels = manipulator.getFillLevels($scope.origFillLevels, $scope.data, $scope.viewdata);
        console.log($scope.fillLevels);

        /*
        $scope.fillLevels = manipulator.getFillLevels(['Pumpspeicher','Speicher','Biomasse','Power2Gas'], hydro);
        $scope.fillLevels.forEach(function(chart){
          chart.type = 'line';
        });
        console.log('filllevel',$scope.fillLevels);
        */
      }, true);

      $scope.options = {
        chart: {
            type: 'multiChart',
            height: 650,
            margin : {
                top: 320,
                right: 80,
                bottom: 100,
                left: 60
            },
            color: d3.scale.category10().range(),
            useInteractiveGuideline: true,
            duration: 500,
            yLabel:'soso',
            xAxis: {
              ticks:8,
              showMaxMin: false,
              tickFormat: function(d) {
                var t=moment(d).format('ddd DD.MMM.YYYY');
                /*
                switch($scope.ctrl.timetype){
                  case 'day':
                    t= moment(d).format('HH:mm');  //d3.time.fmt(rmat('%x')(new Date(d))
                    break;
                  case 'week':
                    t= moment(d).format('ddd DD.MMM.YYYY HH:mm');  //d3.time.fmt(rmat('%x')(new Date(d))
                    break;
                  default:
                    t= moment(d).format('ddd DD.MMM.YYYY');  //d3.time.fmt(rmat('%x')(new Date(d))
                }
                */
              return t;
                //return d3.time.fmt(rmat('%x')(new Date(moment(d).format('DD.MMM HH:mm'))));
              },
              rotateLabels: 20,
            },
            yAxis1: {
                tickFormat: function(d){
                    return d3.format(',.1f')(d);
                },
                axisLabel:'GWh'
            },
            legend: {
              margin:{
                left:-700,
                bottom:200
              },
              dispatch: {
                  stateChange: function(e) {
                    //legendStateChanged();
                  }
              }
            },
        }
      };

    }
  }
});
