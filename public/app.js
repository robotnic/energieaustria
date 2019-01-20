var app = angular.module('plunker', ['charts','config','diffcharts','filllevel','pie','hydrostorage','delta','sum','bill','installed', 'electrolysis', 'ngMaterial', 'totalinstalled', 'eventHandler', 'deep']);
app.config(function($mdAriaProvider) {
   // Globally disables all ARIA warnings.
   $mdAriaProvider.disableWarnings();
});
app.controller('MainCtrl', function($scope, dataManager,$location, $http, totalInstalledFactory, eventHandler, deeplinker) {

  function initialize() {
    totalInstalledFactory.init().then(function(){
      $scope.initialized = true;
    });
  }
  initialize();


  $scope.mindate = new Date('2015-01-01');
  $scope.ctrl = {
    date: moment().format('YYYYMMDD'),
    timetype: 'day',
    layercode: '0111111111111111111111',
    keep: false
  }
  console.log($scope.ctrl);
  $scope.mutate = {
    Solar:0,
    Wind:0,
    Transport:0,
    Power2Gas:0,
    Power2GasMax:0
  }




/*
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
  if(hashParts[4]){
    $scope.ctrl.activeTab=hashParts[4];
  }
  */

  function readMutation(mutateString){
    console.log('readMutate');
    var mutate ={};
    var parts = mutateString.split('&');
    parts.forEach(function(part){
      var name = part.split('=')[0]; 
      var value = part.split('=')[1]; 
      mutate[name]=parseFloat(value); 
    });
    return mutate;
  }

  $scope.previouseDay=function(){
    $scope.ctrl.keep = false;
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

  $scope.nextDay=function(keep){
    $scope.ctrl.keep = keep;
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


  $scope.$watch('ctrl.date', function(){
    init(false);
  });

  $scope.$watch('ctrl', function(newvalue, oldvalue) {
    if (newvalue) {
      eventHandler.date(newvalue, oldvalue, $scope.ctrl);
    }
    deeplinker.link('ctrl', $scope.ctrl);
  }, true);
  $scope.$watch('mutate',function(value){
    $scope.viewdata = eventHandler.mutate($scope.mutate, $scope.source, $scope.ctrl);
    deeplinker.link('mutate', $scope.mutate);
  }, true);

  function init(reload, original){
    var hashData = deeplinker.parse($scope);
    eventHandler.init($scope.ctrl, $scope.mutate, reload).then(function(result){
      $scope.original = result.data;
      $scope.originaldata = result.originaldata;
      $scope.viewdata = result.viewdata;
      $scope.data = result.data;
    });
  }

  function showData(data){
    $scope.viewdata = result.data;
  }

  $scope.setOriginal = function(){
        $scope.cachedViewData = $scope.viewdata;
        $scope.viewdata = $scope.original;
  }
  $scope.setModified = function(){
        $scope.viewdata = eventHandler.mutate($scope.mutate, $scope.source, $scope.ctrl);

  }

  $scope.init = init;

  $scope.reload = function(){
    init(true);
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
