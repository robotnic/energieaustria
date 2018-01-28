angular.module('hydrostorage', ['nvd3','energiecharts'])

.directive('hydrostorage', function() {
  return {
    scope:{
      date:'='
    },
    template:`<h4>Hydrostorage</h4>
    <div class="outer">
    <div class="inner" style="min-height:{{percent}}">
{{month}} {{percent}} <br/>
{{abs}} GWh<br/>
    </div>
    </div>
{{currentEnergy}} GWh
    `,
    controller: function($scope, dataManager, $q, $http) {
      $scope.$watch('date',function(){
        update(); 
      });
      function update(){
        var m = moment($scope.date);
        dataManager.getHydroStorage(m.year()+'%',m.month()).then(function(response){
          $scope.percent = Math.round(response*100) + "%";
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

