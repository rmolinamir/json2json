/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// handle CommonJS/Node.js or browser

const sysmo = (typeof require === 'function' ? require('sysmo') : undefined) || (typeof window !== 'undefined' && window !== null ? window.Sysmo : undefined);

// class definition

class TemplateConfig {
  static initClass() {
    this.defaults = {
      path: '.',
      as: {},
      ignoreEmpty: true
    };
  }

  constructor(config) {
    this.getPath = this.getPath.bind(this);
    this.getKey = this.getKey.bind(this);
    this.getValue = this.getValue.bind(this);
    this.processable = this.processable.bind(this);
    this.aggregate = this.aggregate.bind(this);
    this.applyFormatting = this.applyFormatting.bind(this);
    sysmo.extend(config, this.constructor.defaults);

    // convert property name to array
    if (sysmo.isString(config.choose)) { config.choose   = [config.choose]; }
    // include multiple templates to apply before this one
    if (sysmo.isString(config.include)) { config.include  = [config.include]; }

    // create settings
    this.arrayToMap     = !!config.key;
    // Convert a map to an array...
    // This property was created to show how to specify converting maps to arrays
    this.mapToArray     = !this.arrayToMap && (config.key === false) && !config.as;
    this.directMap      = !!(this.arrayToMap && config.value);
    this.nestTemplate   = !!config.nested;
    this.includeAll     = !!config.all;
    this.ensureArray    = !!config.ensureArray;
    this.ignoreEmpty    = !!config.ignoreEmpty;

    this.config         = config;
  }

  getPath() {
    return this.config.path;
  }

  // used to get a key when converting an array to a map
  getKey(node) {
    switch (sysmo.type(this.config.key)) {
      case 'Function':   return {name: 'value',    value: this.config.key(node)};
      default:                    return {name: 'path',     value: this.config.key};
    }
  }

  // used to get a single value when converting an array to a map
  getValue(node, context) {
    switch (sysmo.type(this.config.value)) {
      case 'Function':   return {name: 'value',    value: this.config.value(node)};
      case 'String':     return {name: 'path',     value: this.config.value};
      default:                    return {name: 'template', value: this.config.as};
    }
  }

  // indicates if the key/value pair should be included in transformation
  processable(node, value, key) {
    // no choose() implies all properties go,
    // but there are other properties that may cause filtering
    if (!this.config.choose && this.includeAll) { return true; } // and !@nestTemplate

    // convert array to chooser function that compares key names
    if (!this.config.choose && !this.paths) {
      this.paths = [];
      for (key in this.config.as) {
        value = this.config.as[key];
        if (sysmo.isString(value)) {
          this.paths.push(value.split('.')[0]);
        }
      }
    }
    // create callback for arry
    if (sysmo.isArray(this.config.choose)) {
      let paths = this.paths || [];
      paths = paths.concat(this.config.choose);
      for (let path of Array.from(paths)) { if (path.split('.')[0] === key) { return true; } }
      return false;
    }
    // if not a function yet, treat as boolean value
    if (!sysmo.isFunction(this.config.choose)) {
      // if config.key and config.value exist, most likely want to map all
      return !!(this.includeAll || this.directMap); //boolean
    } else {
      return !!this.config.choose.call(this, node, value, key);
    }
  }

  // used to combine or reduce a value if one already exists in the context.
  // can be a map that aggregates specific properties
  aggregate(context, key, value, existing) {
    const aggregator = (this.config.aggregate != null ? this.config.aggregate[key] : undefined) || this.config.aggregate;

    if (!sysmo.isFunction(aggregator)) { return false; }

    context[key] = aggregator(key, value, existing);

    return true;
  }

  applyFormatting(node, value, key) {
    // if key is a number, assume this is an array element and skip
    let pair;
    if (!sysmo.isNumber(key)) {
      const formatter = (this.config.format != null ? this.config.format[key] : undefined) || this.config.format;
      pair      = sysmo.isFunction(formatter) ? formatter(node, value, key) : {};
    } else {
      pair      = {};
    }

    if (!('key' in pair)) { pair.key    = key; }
    if (!('value' in pair)) { pair.value  = value; }
    return pair;
  }
}
TemplateConfig.initClass();

// register module (CommonJS/Node.js) or handle browser

if (typeof module !== 'undefined' && module !== null) {
  module.exports = TemplateConfig;
} else {
  if (!window.json2json) { window.json2json = {}; }
  window.json2json.TemplateConfig = TemplateConfig;
}
