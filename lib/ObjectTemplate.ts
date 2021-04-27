/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// handle CommonJS/Node.js or browser

const sysmo           = (typeof require === 'function' ? require('sysmo') : undefined) || (typeof window !== 'undefined' && window !== null ? window.Sysmo : undefined);
const TemplateConfig  = (typeof require === 'function' ? require('./TemplateConfig') : undefined) || (typeof window !== 'undefined' && window !== null ? window.json2json.TemplateConfig : undefined);

// class definition

class ObjectTemplate {
  constructor(config, parent) {
    this.transform = this.transform.bind(this);
    this.processArray = this.processArray.bind(this);
    this.processMap = this.processMap.bind(this);
    this.createMapStructure = this.createMapStructure.bind(this);
    this.chooseKey = this.chooseKey.bind(this);
    this.chooseValue = this.chooseValue.bind(this);
    this.processTemplate = this.processTemplate.bind(this);
    this.processRemaining = this.processRemaining.bind(this);
    this.updateContext = this.updateContext.bind(this);
    this.aggregateValue = this.aggregateValue.bind(this);
    this.nodeToProcess = this.nodeToProcess.bind(this);
    this.getNode = this.getNode.bind(this);
    this.pathAccessed = this.pathAccessed.bind(this);
    this.paths = this.paths.bind(this);
    this.config = new TemplateConfig(config);
    this.parent = parent;
  }

  transform(data) {
    const node = this.nodeToProcess(data);
    if (node == null) { return null; }

    // process properties
    switch (sysmo.type(node)) {
      case 'Array':  return this.processArray(node);
      case 'Object': return this.processMap(node);
      default: return null; //node
    }
  }

  // assume each array element is a map
  processArray(node) {
    // convert array to hash if config.arrayToMap is true
    const context = this.config.arrayToMap ? {} : [];

    for (let index = 0; index < node.length; index++) { //when @config.processable node, element, index
      // convert the index to a key if converting array to map
      // @updateContext handles the context type automatically
      var key, value;
      const element = node[index];
      if (!this.config.mapToArray) {
        key = this.config.arrayToMap ? this.chooseKey(element) : index;
        // don't call @processMap because it can lead to double nesting if @config.nestTemplate is true
        value = this.createMapStructure(element);
        // because we don't call @processMap we have to manually ensure values are arrays
        if (this.config.arrayToMap && this.config.ensureArray && (context[key] == null)) {
          value = [value];
        }
      } else {
        key = index;
        // we are calling both @createMapStructure and @processMap because we need to
        // create the map structure for the choosen keys in `choose` as well as map it
        // to an array
        if (this.config.config.choose) {
          value = this.processMap(this.createMapStructure(element));
        } else {
          value = this.processMap(element);
        }
      }
      this.updateContext(context, element, value, key);
    }

    return context;
  }

  processMap(node) {

    // convert hash to array if config.mapToArray is true
    let context, nested_key;
    if (this.config.mapToArray) {
      context = [];

      // Simple iteration and context updation
      for (let key in node) {
        const value = node[key];
        this.updateContext(context, node, value, key);
      }

      return context;
    }

    if (this.config.ensureArray) { return this.processArray([node]); }

    context = this.createMapStructure(node);

    if (this.config.nestTemplate && (nested_key = this.chooseKey(node))) {
      const nested_context              = {};
      nested_context[nested_key]  = context;
      context                     = nested_context;
    }

    return context;
  }

  createMapStructure(node) {

    const context = {};

    if (!this.config.nestTemplate) { return this.chooseValue(node, context); }

    // loop through properties to pick up any key/values that should be nested
    for (let key in node) {
      // call @getNode() to register the use of the property on that node
      let value = node[key];
      if (this.config.processable(node, value, key)) {
        const nested  = this.getNode(node, key);
        value   = this.config.mapToArray ? nested : this.chooseValue(nested);
        this.updateContext(context, nested, value, key);
      }
    }
    return context;
  }

  chooseKey(node) {
    const result = this.config.getKey(node);

    switch (result.name) {
      case 'value':    return result.value;
      case 'path':     return this.getNode(node, result.value);
      default: return null;
    }
  }

  chooseValue(node, context) {
    if (context == null) { context = {}; }
    const result = this.config.getValue(node);

    switch (result.name) {
      case 'value':    return result.value;
      case 'path':     return this.getNode(node, result.value);
      case 'template': return this.processTemplate(node, context, result.value);
      default: return null;
    }
  }

  processTemplate(node, context, template) {

    // loop through properties in template
    if (template == null) { template = {}; }
    for (var key in template) {
      // process mapping instructions
      var filter;
      let value = template[key];
      switch (sysmo.type(value)) {
        // string should be the path to a property on the current node
        case 'String':   filter = (node, path)   => this.getNode(node, path); break;
        // array gets multiple property values
        case 'Array':    filter = (node, paths)  => Array.from(paths).map((path) => this.getNode(node, path)); break;
        // function is a custom filter for the node
        case 'Function': filter = (node, value)  => value.call(this, node, key); break;
        case 'Object':   filter = (node, config) => new this.constructor(config, this).transform(node); break;
        default:                  filter = (node, value) => value;
      }

      value = filter(node, value);
      this.updateContext(context, node, value, key);
    }

    this.processRemaining(context, node);
    return context;
  }

  processRemaining(context, node) {
    // loop through properties to pick up any key/values that should be chosen.
    // skip if node property already used, the property was specified by the template, or it should not be choose.
    for (let key in node) {
      const value = node[key];
      if (!this.pathAccessed(node, key) && !Array.from(context).includes(key) && this.config.processable(node, value, key)) {
        this.updateContext(context, node, value, key);
      }
    }
    return context;
  }

  updateContext(context, node, value, key) {
    // format key and value
    const formatted = this.config.applyFormatting(node, value, key);
    if (sysmo.isArray(formatted)) {
      return Array.from(formatted).map((item) => this.aggregateValue(context, item.key, item.value));
    } else if (formatted != null) {
      return this.aggregateValue(context, formatted.key, formatted.value);
    }
  }

  aggregateValue(context, key, value) {
    if ((value == null) && !!this.config.ignoreEmpty) { return context; }

    // if context is an array, just add the value
    if (sysmo.isArray(context)) {
      if (this.config.config.flatArray && sysmo.isArray(value)) {
        context.push.apply(context, value);
      } else {
        context.push(value);
      }

      return context;
    }

    const existing = context[key];

    if (this.config.aggregate(context, key, value, existing)) { return context; }

    if ((existing == null)) {
      context[key] = value;
    } else if (!sysmo.isArray(existing)) {
      context[key] = [existing, value];
    } else {
      context[key].push(value);
    }

    return context;
  }

  nodeToProcess(node) {
    return this.getNode(node, this.config.getPath());
  }

  getNode(node, path) {
    if (!path) { return null; }
    if (path === '.') { return node; }
    this.paths(node, path);
    return sysmo.getDeepValue(node, path, true);
  }

  pathAccessed(node, path) {
    const key = path.split('.')[0];
    return this.paths(node).indexOf(key) !== -1;
  }

  // track the first property in a path for each node through object tree
  paths(node, path) {
    let paths;
    if (path) { path = path.split('.')[0]; }

    if (!this.pathNodes) { this.pathNodes = (this.parent && this.parent.pathNodes) || []; }
    if (!this.pathCache) { this.pathCache = (this.parent && this.parent.pathCache) || []; }

    const index = this.pathNodes.indexOf(node);

    if (!path) { return (index !== -1 ? this.pathCache[index] : []); }

    if (index === -1) {
      paths = [];
      this.pathNodes.push(node);
      this.pathCache.push(paths);
    } else {
      paths = this.pathCache[index];
    }

    if (path && (paths.indexOf(path) === -1)) { paths.push(path); }
    return paths;
  }
}

module.exports = ObjectTemplate;
