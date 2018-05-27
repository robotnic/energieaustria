angular.module('TimeShift',[])
.factory('timeshift',function(){
  console.log('inside factory loadshift');
  return {
    shift:function(){
      console.log('shifting');
    }
  }
});
