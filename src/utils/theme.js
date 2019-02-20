import {
  isObject,
  isString,
  isArray,
  capitalize,
  kebabCase,
  get,
  has,
  hasAny,
  toPairs,
  set,
} from './_';

const cssProps = ['bg', 'text'];
const colors = ['blue', 'red', 'orange'];
const colorSuffixes = [
  'L5',
  'L4',
  'L3',
  'L2',
  'L1',
  'D1',
  'D2',
  'D3',
  'D4',
  'D5',
];

const targetProps = ['base', 'start', 'end', 'startEnd'];
const displayProps = ['class', 'style', 'color', 'fillMode'];

export const defaultThemeConfig = {
  color: 'blue',
  highlight: {
    base: {
      fillMode: 'light',
    },
    startEnd: {
      fillMode: 'solid',
    },
  },
};

// Creates all the css classes needed for the theme
function mixinCssClasses(target) {
  cssProps.forEach(prop => {
    colors.forEach(color => {
      colorSuffixes.forEach(colorSuffix => {
        const key = `${prop}${capitalize(color)}${colorSuffix}`;
        target[key] = kebabCase(key);
      });
    });
  });
  return target;
}

// Normalizes attribute config to the structure defined by the properties
function normalizeAttr({
  config,
  type,
  targetProps,
  displayProps,
  themeConfig,
}) {
  let root = {};
  let rootColor = themeConfig.color || defaultThemeConfig.color;
  // Assign default attribute for booleans or strings
  if (config === true || isString(config)) {
    rootColor = isString(config) ? config : rootColor;
    root = { ...(themeConfig[type] || defaultThemeConfig[type]) };
    // Mixin objects at top level
  } else if (isObject(config)) {
    root = { ...config };
  } else {
    return null;
  }
  // Move non-target properties to base target
  if (!hasAny(root, targetProps)) {
    root = { base: { ...root } };
  }
  // Normalize each target
  toPairs(root).forEach(([targetType, targetConfig]) => {
    let targetColor = rootColor;
    if (targetConfig === true || isString(targetConfig)) {
      targetColor = isString(targetConfig) ? targetConfig : targetColor;
      root[targetType] = { color: targetColor };
    } else if (isObject(targetConfig)) {
      root[targetType] = { ...targetConfig };
    }

    if (!hasAny(root[targetType], displayProps)) {
      root[targetType] = { style: { ...root[targetType] } };
    }

    displayProps.forEach(displayType => {
      const displayPath = `${targetType}.${displayType}`;
      if (!has(root, displayPath) && has(themeConfig[type], displayPath)) {
        set(root, displayPath, get(themeConfig[type], displayPath));
      }
    });
    // Set the theme color if it is missing
    if (!has(root, `${targetType}.color`)) {
      set(root, `${targetType}.color`, targetColor);
    }
  });
  return root;
}

export const normalizeHighlight = (
  config,
  themeConfig = defaultThemeConfig,
) => {
  return normalizeAttr({
    config,
    type: 'highlight',
    targetProps,
    displayProps,
    themeConfig,
  });
};

const createTheme = Vue => {
  const theme = {
    classes: mixinCssClasses({}),
  };
  Vue.prototype.$theme = theme;
};

export default createTheme;