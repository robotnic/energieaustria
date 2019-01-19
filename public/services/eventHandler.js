angular.module('eventHandler', ['energiecharts', 'manipulate'])

  .factory('eventHandler', function(dataManager, manipulator, $q) {
    var theDate = null;
    var theData = null;
    var theSources = null;
    var year = null;

    function date(newvalue, oldvalue, ctrl) {
      if (newvalue.myDate) {
        theDate = newvalue.myDate;
        var date = moment(ctrl.myDate).startOf(ctrl.timetype);
        DateString = moment(date).format('YYYYMMDD');
        year = moment(date).format('YYYY');

        if (ctrl.date !== DateString) {
          ctrl.date = DateString;
          //            init(DateString);
        }

        switch (ctrl.timetype) {
          case 'day':
            ctrl.titledate = moment(ctrl.date).format('YYYY MMM DD');
            break;
          case 'week':
            var from = moment(ctrl.date).startOf(ctrl.timetype);
            var to = moment(ctrl.date).endOf(ctrl.timetype);
            if (from.format('MMM') === to.format('MMM')) {
              ctrl.titledate = from.format('YYYY') + ' ' + from.format('MMM') + ' ' + from.format('DD') + '  - ' + to.format('DD');;
            } else {
              ctrl.titledate = from.format('YYYY') + ' ' + from.format('MMM') + ' ' + from.format('DD') + '  - ' + to.format('MMM') + ' ' + to.format('DD');;
            }
            break;
          case 'month':
            var from = moment(ctrl.date);
            ctrl.titledate = from.format('YYYY') + ' ' + from.format('MMM');
            break;
          default:
            ctrl.titledate = 'loading...';


        }
        return ctrl;
      }
      
    }


    //load charts

    function init(ctrl, mutateValues,  reload) {
      var q = $q.defer();
      var dateString=moment(ctrl.myDate).format('YYYYMMDD');

      dataManager.getSources().then(function(sources) {;
        theSources = sources;
        dataManager.loadCharts(dateString, ctrl, reload).then(function(data) {
          theData = data;
          var values = [];
          data[0].values.forEach(function(value) {
            values.push({
              x: value.x,
              y: 0
            });
          })
          var surplus = 0;
          if (ctrl.keep) {
            surplus = ctrl.pumpsurplus;
          }
          var manipulationResult = manipulator.manipulate(data, mutateValues, sources, ctrl); //here the manipulation happens
          var viewdata = manipulationResult.data;
          ctrl.totals = manipulationResult.totals;
          ctrl.originalTotals = manipulationResult.originalTotals;
          q.resolve({
            viewdata:viewdata,
            data:data

          });
          //var hash = readHash();
        }, function(error) {
          console.log(error);
        });
      });
      return q.promise;
    }

    //watch manipulation
    function mutate(mutateValues, source, ctrl) {
      /*
      if ($scope.ctrl.timetype === 'month') {
        console.log('duration before', $scope.options.chart.duration);
        $scope.options.chart.duration = 0;
        console.log('duration after', $scope.options.chart.duration);
      } else {
        $scope.options.chart.duration = 500;
      }
      */
      if (typeof(theData) !== 'undefined' && theData) {
        var surplus = 0;
        if (ctrl.keep) {
          surpulus = ctrl.pumpsurplus;
        }
        console.log('theData', theData)
        var manipulationResult = manipulator.manipulate(theData, mutateValues, theSources, ctrl); //here the manipulation happens
        var viewdata = manipulationResult.data;
        ctrl.totals = manipulationResult.totals;
        ctrl.pumpsurplus = manipulationResult.pumpsurplus;
        //readHash();
        //setHash();
      }else{
        console.log('no data in mutate')
      }
      return viewdata
    }



    return {
      date: date,
      mutate: mutate,
      init: init
    }

  });
