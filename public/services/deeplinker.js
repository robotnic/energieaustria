angular.module('deep',[])
.factory('deeplinker',function(){
  var linkData = {};
  var api = {
    link: link,
    parse: parseHash
  }
  return api


  function link(name, data){
    linkData[name] = data;
    console.log('++++',name, JSON.stringify(data, null, 2));
    var vs = '#!#';
    for(var d in linkData){
      vs += d + '=';
      for(var name in linkData[d]) {
        var value = linkData[d][name];
        vs += name + ':' + value + ';';
      }
      vs +='&'
    }
    location.hash = vs;
    //parseHash('ctrl');
  }

  function parseHash(scope) {
    console.log('thescorp', scope);
    var all = {};
    var hash = location.hash.slice(3); //remove #!#
    var parts = hash.split('&');
    parts.forEach(function(part){
      var topicContent = part.split('=');
      var topic = topicContent[0];
      var content = topicContent[1];
      if(content) {
        if (!scope[topic]) {
          scope[topic] = {};
        }
        var nameValues = content.split(';');
        nameValues.forEach(function(nameValue){
          var parts2 = nameValue.split(':');
          var key = parts2[0];
          var value = parts2[1];
          if(!isNaN(value)) {
            value = parseInt(value);
          }
          scope[topic][key] = value;
        })
      }
    })
    console.log('hash read', all);
  }
});