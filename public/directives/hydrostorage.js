angular.module('hydrostorage', ['nvd3','energiecharts'])

.directive('hydrostorage', function() {
  return {
    scope:{
      date:'='
    },
    template:`<h4>Hydrostorage</h4>
    <div class="outer">
    <div class="inner" style="min-height:{{percent}}">
{{month}} {{percent}} 
    </div>
    </div>
    `,
    controller: function($scope, dataManager, $q) {
      $scope.$watch('date',function(){
        init(); 
      });
      function init(){
        var m = moment($scope.date);
        dataManager.getHydroStorage(m.year()+'%',m.month()).then(function(response){
          $scope.percent = Math.round(response*100) + "%";
          $scope.month = m.format('MMM');
        });
      }
    }
  }
});

