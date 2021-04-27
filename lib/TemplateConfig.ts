export class TemplateConfig {
  static defaults = {
    path: '.',
    as: {},
    ignoreEmpty: true
  };

  public arrayToMap: boolean;

  public mapToArray: boolean;

  public directMap: boolean;

  public nestTemplate: boolean;

  public includeAll: boolean;

  public ensureArray: boolean;

  public ignoreEmpty: boolean;

  public paths?: Array<unknown>;

  public config;

  constructor(args) {
    const config = Object.assign({}, TemplateConfig.defaults, args);
    this.getPath = this.getPath.bind(this);
    this.getKey = this.getKey.bind(this);
    this.getValue = this.getValue.bind(this);
    this.processable = this.processable.bind(this);
    this.aggregate = this.aggregate.bind(this);
    this.applyFormatting = this.applyFormatting.bind(this);

    // Convert property name to array.
    if (typeof config.choose === 'string') { config.choose   = [config.choose]; }

    // Include multiple templates to apply before this one.
    if (typeof config.include === 'string') { config.include  = [config.include]; }

    // create settings
    this.arrayToMap = Boolean(config.key);

    // Convert a map to an array...
    // This property was created to show how to specify converting maps to arrays
    this.mapToArray = Boolean(!this.arrayToMap && (config.key === false) && !config.as);
    this.directMap = Boolean(this.arrayToMap && config.value);
    this.nestTemplate = Boolean(config.nested);
    this.includeAll = Boolean(config.all);
    this.ensureArray = Boolean(config.ensureArray);
    this.ignoreEmpty = Boolean(config.ignoreEmpty);

    this.config = config;
  }

  getPath() {
    return this.config.path;
  }

  /**
   * Used to get a key when converting an array to a map.
   * @param node 
   * @returns 
   */
  getKey(node) {
    switch (typeof this.config.key) {
      case 'function': {
        return {
          name: 'value',
          value: this.config.key(node),
        };
      };
      default: {
        return {
          name: 'path',
          value: this.config.key,
        };
      };
    }
  }

  /**
   * Used to get a single value when converting an array to a map.
   * @param node 
   * @param context 
   * @returns 
   */
  getValue(node, context) {
    switch (typeof this.config.value) {
      case 'function': {
        return {
          name: 'value', 
          value: this.config.value(node),
        };
      };
      case 'string': {
        return {
          name: 'path',
          value: this.config.value,
        };
      };
      default: {
        return {
          name: 'template',
          value: this.config.as,
        };
      };
    }
  }

  /**
   * Indicates if the key/value pair should be included in transformation
   * @param node 
   * @param value 
   * @param key 
   * @returns 
   */
  processable(node, value, key) {
    // No `choose()` implies all properties go, but there are other properties
    // that may cause filtering.

    if (!this.config.choose && this.includeAll) { // TODO: and !@nestTemplate
      return true;
    }

    // Convert array to chooser function that compares key names.
    if (!this.config.choose && !this.paths) {
      this.paths = [];

      for (key in this.config.as) {
        value = this.config.as[key];

        if (typeof value === 'string') {
          this.paths.push(value.split('.')[0]);
        }
      }
    }

    // Create callback for array.
    if (Array.isArray(this.config.choose)) {
      let paths = this.paths || [];

      paths = paths.concat(this.config.choose);

      for (let path of paths as string[]) {
        if (path.split('.')[0] === key) {
          return true;
        } 
      }
      return false;
    }

    // If not a function yet, treat as boolean value.
    if (!(typeof this.config.choose === 'function')) {
      // If config.key and config.value exist, most likely want to map all.
      return Boolean(this.includeAll || this.directMap);
    } else {
      return Boolean(this.config.choose(this, node, value, key));
    }
  }

  /**
   * Used to combine or reduce a value if one already exists in the context.
   * Can be a map that aggregates specific properties.
   * @param context 
   * @param key 
   * @param value 
   * @param existing 
   * @returns 
   */
  aggregate(context, key, value, existing) {
    const aggregator = (this.config.aggregate != null ? this.config.aggregate[key] : undefined) || this.config.aggregate;

    if (!(typeof aggregator === 'function')) { return false; }

    context[key] = aggregator(key, value, existing);

    return true;
  }

  /**
   * 
   * @param node 
   * @param value 
   * @param key 
   * @returns 
   */
  applyFormatting(node, value, key) {
    // If key is a number, assume this is an array element and skip
    let pair;

    if (!(typeof key === 'number' && isFinite(key))) {
      const formatter = (this.config.format != null ? this.config.format[key] : undefined) || this.config.format;
      pair = typeof formatter === 'function' ? formatter(node, value, key) : {};
    } else {
      pair = {};
    }

    if (!('key' in pair)) {
      pair.key = key;
    }

    if (!('value' in pair)) {
      pair.value = value;
    }

    return pair;
  }
}
