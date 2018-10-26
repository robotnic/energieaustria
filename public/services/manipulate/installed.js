/*
The exact amount of installed renewables is not available.
There are values for 2016, 2017, 2018.
The year by year changes are significant and can change the calculations significant.
To make it more exact, here the attempt of interpolation. 

normalized(date, type [wind, solar]) -> 


*/



angular.module('totalinstalled',[])
.factory('totalInstalledFactory',function($http, $q){
  var types = ['Wind','Solar']
  var years = [2015, 2016, 2017, 2018];  //todo: bring to config file
  var installed = {}

  function init() {
    var q = $q.defer();
    var promises = [];

    years.forEach(function(year){
      promises.push(getInstalled(year));
    });
    $q.all(promises).then(function(responses){
      years.forEach(function(year, i){
        installed[year] = {}
        responses[i].forEach(function(item){
          installed[year][item.Title] = item.Value;
        });
      });
      console.log('INSTALLED',installed); 
      q.resolve(installed);
    });
    return q.promise;
  }
 
  function getInstalled(year) { 
    var q = $q.defer();
    $http.get('/data/installed/'+year).then(function(response){
      q.resolve(response.data);
    },function(error){
      q.reject(error);
    });
    return q.promise;
  }

  function normalized(date, type){
    var year = moment(date).year();
    var beginOfYear = moment(year+'-01-01');
    var endOfYear = moment((year +1) +'-01-01');
    var beginYear = beginOfYear.year() -1;
    var endYear = endOfYear.year();
    if (endYear > years[years.length -1]){
      //extrapolate
      endYear--;
      beginYear--;
    }
    var begin = moment().year(beginYear).startOf('year').unix();
    var end = moment().year(endYear).startOf('year').unix();
    var value = installed[beginYear][type] + (installed[endYear][type] - installed[beginYear][type]) / (end - begin) * (moment(date).unix() - begin);
    console.log('factor', value, installed[beginYear][type] , installed[endYear][type]);
    var returnValue = value / 1000; // installed[2018][type];
    console.log(returnValue);
    return returnValue;
  }

  return {
    normalized: normalized,
    init: init
  }
});
