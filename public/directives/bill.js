angular.module('bill', ['nvd3','energiecharts','manipulate'])

.directive('bill', function() {
  return {
    scope:{
      ctrl:'=',
      totals:'=',
      sources:'=',
      mutate:'='
    },
    template:`
<md-list ng-cloak tyle="max-width:800px" ng-style="ctrl.loading && {opacity:0.5}" class="flex">

  <md-subheader class="md-sticky">Milchmächen Rechnung</md-subheader>
  <md-list-item>
    <p style="width:00px"> </p>
    <div class="md-secondar" style="width:150px;text-align:right"> original (GWh)</div>
    <div class="md-secondar" style="width:150px;text-align:right"> total (GWh)</div>
    <div class="md-secondar" style="width:150px;text-align:right"> delta </div>
    <div class="md-secondar" style="width:150px;text-align:right"> price (€/MWh)</div>
    <div class="md-secondar" style="width:150px;text-align:right"> original price </div>
    <div class="md-secondar" style="width:150px;text-align:right"> modified price </div>
    <div class="md-secondar" style="width:150px;text-align:right"> delta price </div>
  </md-list-item>
  <md-divider></md-divider>
  <md-list-item ng-repeat="(k,v) in totals" ng-if="v.delta != 0">
    <p style="width:200px">{{k}}</p>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.original|number:1}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.modified|number:1}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.delta|number:1}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{sources[k].energyprice|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.original * sources[k].energyprice * 1000|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.modified * sources[k].energyprice * 1000|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{v.delta * sources[k].energyprice * 1000|currency:'€'}} </div>
  </md-list-item>

  <md-divider></md-divider>
  <md-list-item class="secondary-button-padding" style="font-weight:bold">
    <p style="width:200px">Summe</p>
    <div class="md-secondar" style="width:150px;text-align:right"> {{sum.original|number:1}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{sum.modified|number:1}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{sum.delta|number:1}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> . </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{totalPrices.original|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{totalPrices.modified|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{totalPrices.delta|currency:'€'}} </div>
  </md-list-item>
  <md-divider></md-divider>
  <md-divider></md-divider>
  <md-list-item class="secondary-button-padding">
    <p>EV Energycost</p>
    <div class="md-secondar" style="width:150px;text-align:right">{{50|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right">{{0|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right">{{totals.Transport.original* mutate.Transport/100 *  sources.Transport.energyprice * 1000|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right">{{totals.Transport.original* mutate.Transport/100 *  sources.Transport.energyprice * 1000|currency:'€'}} </div>
  </md-list-item>
 
  <md-list-item class="secondary-button-padding">
    <p>Benzin Diesel </p>
    <div class="md-secondar" style="width:150px;text-align:right">{{benzin().original |currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right">{{benzin().original * (1-mutate.Transport/100)|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right">{{-benzin().original * (mutate.Transport/100)|currency:'€'}} </div>
  </md-list-item>
  <md-divider></md-divider>
  <md-list-item class="secondary-button-padding">
    <p><strong>Transport Total</strong></p>
    <div class="md-secondar" style="width:150px;text-align:right"> {{benzin().original|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{totals.Transport.original* mutate.Transport/100 *  sources.Transport.energyprice * 1000 + benzin().original * (1-mutate.Transport/100)|currency:'€'}} </div>
    <div class="md-secondar" style="width:150px;text-align:right"> {{totals.Transport.original* mutate.Transport/100 *  sources.Transport.energyprice * 1000 - benzin().original * (mutate.Transport/100)|currency:'€'}} </div>
  </md-list-item>
<!--
  <md-subheader class="md-no-sticky">Investments</md-subheader>
<md-list-item class="secondary-button-padding">
Solar
  </md-list-item>
-->
</md-list>


    `,
    controller: function($scope, dataManager, manipulator, $q) {
      $scope.matrix={}
      $scope.$watch('ctrl', function(){
        manipulator.waitTotals(function(totals){
          if(!totals)return;
          var priceTypes = ['original','modified','delta'];
          $scope.sum = {};
          $scope.totalPrices = {};
          console.log('waitTotals',totals);
          $scope.totals = totals;
          if(totals.Transport){
//            $scope.totals.Transport.original = 0; 
//            $scope.totals.Transport.delta =  $scope.totals.Transport.modified;
          }
/*
          if(totals){
            $scope.totals.Transport2 ={
              original: 0,
              modified: -$scope.benzin().modified /1000/1000,
              delta: -$scope.benzin().modified /1000/1000
            }
            $scope.sources.Transport2 = {energyprice:80}
          }
  console.log('Transport2', totals);
*/


          for (var total in totals){
            for (var k in totals[total]){
              if (!$scope.sum[k]) {
                $scope.sum[k] = 0;
              }
              $scope.sum[k] += totals[total][k];
            }
            priceTypes.forEach(function(type){
              if($scope.sources[total].energyprice){
                var partSum = parseFloat($scope.sources[total].energyprice) * totals[total][type] * 1000;
                if (!$scope.totalPrices[type]){
                  $scope.totalPrices[type] =0;
                }
                $scope.totalPrices[type] += partSum;
              }
            });
            //$scope.totals.Transport.original = 0; 
          }
            console.log('total prices', $scope.totalPrices);
        });
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
        var modified =   result * (1 - $scope.mutate.Transport / 100);
        return {
          original: result,
          modified: modified,
          delta: modified -result
        }
      }

      
      function calcPrice(t, energy){
        if($scope.sources[t]){
          var energyprice = $scope.sources[t].energyprice || 20;
          return energyprice * energy * 1000;
        }
      } 
    }
  }
});

