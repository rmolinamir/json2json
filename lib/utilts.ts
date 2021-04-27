// TODO: Rewrite sysmo.js' getDeepValue function

//get the value of a property deeply nested in an object hierarchy
function getDeepValue(target, path, traverseArrays) {
      
  // if traversing arrays is enabled and this is an array, loop
  // may be a "array-like" node list (or simi0lar), in which case it needs to be converted
  if (traverseArrays && Sysmo.isArrayLike(target)) {
    
    target = Sysmo.makeArray(target);
    
    var children = [];
    
    for (var i = 0; i < target.length; i++) {
      // recursively loop through children
      var child = Sysmo.getDeepValue(target[i], path, traverseArrays);
      
      // ignore if undefined
      if (typeof child != "undefined") {
        //flatten array because the original path points to one flat result set
        if (Sysmo.isArray(child)) {
          
          for (var j = 0; j < child.length; j++) {
            children.push(child[j]);
          }
          
        } else {
          
          children.push(child);
          
        }
      }
    }
    
    return (children.length) ? children : void(0);
  }
  
  var invoke_regex = /\(\)$/,
      properties = path.split('.'),
      property;

  if (target != null && properties.length) {
    
    var propertyName = properties.shift(),
        invoke = invoke_regex.test(propertyName)
    
    if (invoke) {
      propertyName = propertyName.replace(invoke_regex, "");
    }
    
    if (invoke && propertyName in target) {
      target = target[propertyName]();
    } else {
      target = target[propertyName];
    }
    
    path = properties.join('.');
    
    if (path) {
      target = Sysmo.getDeepValue(target, path, traverseArrays);
    }
  }
  
  return target;
}
