angular.module('bill', ['nvd3','energiecharts'])

.directive('bill', function() {
  return {
    scope:{
      ctrl:'=',
      totals:'=',
      sources:'=',
      mutate:'='
    },
    template:`
<md-list ng-cloak style="max-width:800px">

  <md-subheader class="md-sticky">Milchmächen Rechnung</md-subheader>
  <md-list-item>
    <p style="width:300px"> </p>
    <div class="md-secondar" style="width:150px;text-align:left"> orignal (GWh)</div>
    <div class="md-secondar" style="width:150px;text-align:left"> total (GWh)</div>
    <div class="md-secondar" style="width:150px;text-align:left"> delta </div>
    <div class="md-secondar" style="width:150px;text-align:left"> price (€/MWh)</div>
    <div class="md-secondar" style="width:150px;text-align:left"> delta price </div>
  </md-list-item>
  <md-divider></md-divider>
  <md-list-item ng-repeat="(k,v) in matrix" ng-if="v.delta != 0">
    <p style="width:200px">{{k}}</p>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.originalTotals|number:1}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.totals|number:1}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.delta|number:1}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.price|number:1}} </div>
    <div class="md-secondar" style="width:250px;text-align:right"> {{v.priceDelta|currency:'€'}} </div>
  </md-list-item>

  <md-divider></md-divider>
  <md-list-item class="secondary-button-padding">
    <p>Summe</p>
    <div class="md-secondar" style="width:220px;text-align:right"> {{priceOriginalTotal|currency:'€'}} </div>
    <div class="md-secondar" style="width:220px;text-align:right"> {{priceTotal|currency:'€'}} </div>
    <div class="md-secondary" style="width:220px;text-align:right"> {{total|currency:'€'}} </div>
  </md-list-item>
  <md-divider></md-divider>
  <md-list-item class="secondary-button-padding">
    <p>Benzin Diesel </p>
    <div class="md-secondary" style="width:220px;text-align:right"> {{benzin()|currency:'€'}} </div>
  </md-list-item>
  <md-divider></md-divider>
  <md-list-item class="secondary-button-padding">
    <p><strong>Total</strong></p>
    <div class="md-secondary" style="width:220px;text-align:right"> {{total + benzin()|currency:'€'}} </div>
  </md-list-item>
<
<!--
  <md-subheader class="md-no-sticky">Investments</md-subheader>
<md-list-item class="secondary-button-padding">
Solar
  </md-list-item>
-->
</md-list>

    `,
    controller: function($scope, dataManager, $q) {
      $scope.matrix={}
      $scope.$watch('ctrl', function(){
        $scope.total = 0;
        $scope.priceOriginalTotal = 0;
        $scope.priceTotal = 0;
        for(var t in $scope.ctrl.totals){
          var delta = $scope.ctrl.totals[t] - $scope.ctrl.originalTotals[t];
          var priceDelta = calcPrice(t,delta) || 20;
          var priceDeltaTotals = calcPrice(t,$scope.ctrl.totals[t]);
          var priceDeltaOriginalTotals = calcPrice(t,$scope.ctrl.originalTotals[t]);
          $scope.total += priceDelta;
          $scope.priceTotal += priceDeltaTotals;
          $scope.priceOriginalTotal += priceDeltaOriginalTotals;
          $scope.matrix[t]={
            originalTotals: $scope.ctrl.originalTotals[t],
            totals: $scope.ctrl.totals[t],
            delta: delta,
            priceDelta: priceDelta,
            priceTotals: priceDeltaTotals,
            priceDeltaOriginalTotals: priceDeltaOriginalTotals,
            price: $scope.sources[t].energyprice || 20
          };
        }
      },true);

      $scope.benzin = function(){
        var total=4300000000;
        var result = 0;
        switch($scope.ctrl.timetype){
          case "day":
              result = total /365;
              break; 
          case "week":
              result = total /52;
              break; 
          case "month":
              result = total /12;
              break; 

        }
        result =  - result * $scope.mutate.Transport / 100;
        return result;
      }
      
      function calcPrice(t, energy){
        var energyprice = $scope.sources[t].energyprice || 20;
        return energyprice * energy * 1000;
      } 
    }
  }
});

