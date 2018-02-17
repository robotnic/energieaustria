angular.module('electrolysis', ['nvd3','energiecharts'])

.directive('electrolysis', function() {
  return {
    scope:{
      ctrl:'='
    },
    template:`<h4>Electrolysis</h4>
    <div class="outer">
    <div class="inner" style="min-height:{{surplus}}%; background-color:rgba(0,255,0,0.3)">
{{surplusGWh}} GWh
    </div>
    </div>
    </div>
    `,
    controller: function($scope, dataManager, $q, $http) {
      $scope.$watch('ctrl',function(){
        update(); 
        $scope.surplus = -$scope.ctrl.totals['Power2Gas'] / 400;  //40GWh Storage
        $scope.surplusGWh = Math.round(-$scope.ctrl.totals.Power2Gas);
      }, true);
      $scope.surplus = $scope.ctrl.pumpsurplus;
      function update(){
        var m = moment($scope.ctrl.date);
        dataManager.getHydroStorage(m.year()+'%',m.month()).then(function(response){
          $scope.percent = Math.round(response*100);
          $scope.month = m.format('MMM');
        });
        dataManager.getHydroStorage(m.year(),m.month()).then(function(response){
          $scope.abs = Math.round(response);
        });
        $scope.currentEnergy = getCurrentEnergy(m); 
      }


      function getCurrentEnergy (date){
        if(!date){
          date = $scope.ctrl.myDate;
        }
        if(!$scope.energy)return '-';
        var m = moment(date);
        var w = m.format('w')
        var y = m.format('YYYY');
        var value = 0;
        $scope.energy.forEach(function(week){
          if(week.year === parseInt(y) && week.week === parseInt(w)){
            value = week.value;
          }
        });
        return parseInt(value/1000) ;
      }

      $http.get('/energy').then(function(response){
        $scope.energy = response.data;
        update();
      });
    }

  }
});

