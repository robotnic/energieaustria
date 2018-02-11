var app = angular.module('plunker', ['charts','pie','hydrostorage', 'ngMaterial']);

app.controller('MainCtrl', function($scope, dataManager,$location, $http) {
  $scope.ctrl = {
    date: '20171222',
    timetype: 'day',
    layercode: '0111111111111111111111',
    keep: true
  }
  $scope.mutate = {
    Solar:1,
    Wind:1,
    Transport:0.1
  }
  console.log('hallo', $location.hash());
  var hashParts=$location.hash().split(';');
  if(hashParts[0]){
    $scope.ctrl.date=hashParts[0];
  }

  if(hashParts[1]){
    $scope.ctrl.timetype=hashParts[1];
  }
  if(hashParts[2]){
    $scope.ctrl.layercode=hashParts[2];
  }
  if(hashParts[3]){
    $scope.mutate=readMutation(hashParts[3]);
  }

  function readMutation(mutateString){
    console.log(mutateString);
    var mutate ={};
    var parts = mutateString.split('&');
    parts.forEach(function(part){
      console.log(part.split('='));
      var name = part.split('=')[0]; 
      var value = part.split('=')[1]; 
      mutate[name]=parseInt(value); 
    });
    return mutate;
  }


  $scope.previouseDay=function(){
    var delta = 1;
    switch($scope.ctrl.timetype){
      case 'week':
        delta=7;
        break;
      case 'month':
        delta = 31;
        break;
      default:
        delta = 1;
    }
 
    $scope.ctrl.myDate=moment($scope.ctrl.myDate).subtract(delta,'d');
  }

  $scope.nextDay=function(){
    var delta = 1;
    switch($scope.ctrl.timetype){
      case 'week':
        delta=7;
        break;
      case 'month':
        delta = 31;
        break;
      default:
        delta = 1;
    }
    $scope.ctrl.myDate=moment($scope.ctrl.myDate).add(delta,'d');
  }

/*
  $scope.currentEnergy = function (date){
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
  });
*/



});
