angular.module('config', ['energiecharts'])

.directive('config', function() {
  return {
    scope:{
    },
    template:`
<table class="config">
<tr>
  <th></th>
  <th></th>
  <th>Max store (GW)</th>
  <th>Max release (GW)</th>
  <th>EV GW</th>
  <th>Price €/MWh</th>
  <th>Efficiency</th>
</tr>
<tr ng-repeat="(k,v) in sources">
  <td><div style="width:12px;height:12px;background-color:{{v.color}}"></div></td>
  <td>{{k}}</td>
  <td ng-repeat="type in ['min','max','power','energyprice','efficiency']">
      <md-input-container class="md-block">
        <input ng-model="v[type]"/>
      </md-input-container>
  </td>
/tr>
</table>


`,
    controller: function($scope, dataManager, $q) {
      dataManager.getSources().then(function(sources){
        $scope.sources = sources;
        delete $scope.sources.Curtailment;
      }); 
    }
  }
});

