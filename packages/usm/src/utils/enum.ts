import freeze from './freeze';

const {
  prototype: { hasOwnProperty },
  entries,
  keys,
  defineProperties,
  defineProperty
} = Object;

// 前缀
export type Prefix = string;
// 属性名
export type PropertyKey = string;
export type PropertyKeys = PropertyKey[];

// 属性名为key的map
type Properties<T> = {
  [P in PropertyKey]?: T;
}

// 可枚举类型
interface Enum {
  prefix: Prefix;
  [key: string]: any;
}

/**
 * 一个管理属性的类，支持前缀
 */
class Enum implements Enum {
  constructor(keys: PropertyKeys = [], prefix: Prefix) {
    const properties: PropertyDescriptorMap = {
      prefix: {
        value: prefix,
        configurable: false,
        enumerable: false,
        writable: false,
      },
    };
    keys.forEach((item) => {
      properties[item] = Enum.setPrefix(item, prefix);
    });

    // 将keys赋值给自己。如['a', 'b'] -> {'a': 'a', 'b': 'b'}
    defineProperties(this, properties);
    if (Proxy && Reflect) {
      freeze(this);
    } else {
      Object.freeze(this)
    }
  }

  // 给属性设置前缀，返回一个PropertyDescriptor对象
  static setPrefix(item: PropertyKey, prefix: Prefix):PropertyDescriptor {
    const value = prefix ? `${prefix}-${item}` : item;
    return {
      value,
      configurable: true,
      enumerable: true,
      writable: true,
    };
  }

  // 获取字段长度
  get size() {
    return entries(this).length;
  }

  // 增加属性
  add(item: PropertyKey) {
    if (this[item]) {
      throw new Error(`'${item}' enumeration property already exists for this instance`);
    }
    const property = Enum.setPrefix(item, this.prefix);
    defineProperty(this, item, property);
  }

  // 移除属性
  remove(item: PropertyKey) {
    if (!hasOwnProperty.call(this, item)) {
      throw new Error(`'${item}' enumeration property does not exist for this instance`);
    }
    delete this[item];
  }
}

type EnumInstance = InstanceType<typeof Enum>;

interface PrefixEnum {
  enumMap: EnumInstance;
  prefix: Prefix;
  base: EnumInstance;
}

const prefixCache: Properties<Properties<Properties<string>>> = {};

function prefixEnum({ enumMap, prefix, base = enumMap }: PrefixEnum) {
  if (!prefix || prefix === '') return base;
  if (prefixCache[prefix] === null || typeof prefixCache[prefix] === 'undefined') {
    prefixCache[prefix] = {};
  }
  const cache = prefixCache[prefix];
  if (cache && !cache[base.prefix]) {
    Object.assign(cache, { [base.prefix]: new Enum(keys(enumMap), `${prefix}-${enumMap.prefix}`)});
  }
  return cache && cache[base.prefix];
}

export {
  Enum as default,
  prefixCache,
  prefixEnum,
};
