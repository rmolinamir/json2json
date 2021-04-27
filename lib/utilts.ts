/**
 * Get the value of a property deeply nested in an object hierarchy.
 * @param {target<unknown> | ArrayLike<unknown>} target 
 * @param {string} path 
 * @param {boolean} traverseArrays 
 * @returns {Array<unknown> | undefined}
 */
export function getDeepValue(target, path, traverseArrays = true) {
  // If traversing arrays is enabled and the target is target,
  // the target will be converted to an Array.
  if (Symbol.iterator in Object(target)) {
    target = Array.from(target);

    const children = [];

    for (var i = 0; i < target.length; i++) {
      // Recursively loop through children.
      const child = getDeepValue(target[i], path, traverseArrays);
      
      // Ignore if undefined
      if (typeof child != 'undefined') {
        // Flatten array because the original path points to one
        // flat result set.
        if (Array.isArray(child)) {
          children.push(...child);
        } else {
          children.push(child);
        }
      }
    }

    return (children.length) ? children : undefined;
  }

  const invokeRegex = /\(\)$/;
  const properties = path.split('.');

  if (target != null && properties.length) {

    let propertyName = properties.shift();
    const invoke = invokeRegex.test(propertyName);

    if (invoke) {
      propertyName = propertyName.replace(invokeRegex, "");
    }

    if (invoke && propertyName in target) {
      target = target[propertyName]();
    } else {
      target = target[propertyName];
    }

    path = properties.join('.');

    if (path) {
      target = getDeepValue(target, path, traverseArrays);
    }
  }

  return target;
}
