const nativewind = require('nativewind/babel');

// Wrap the NativeWind preset so we can drop the optional worklets plugin that
// isn't present in this project (and triggers a Babel validation error).
const nativewindPreset = (...args) => {
  const preset = nativewind(...args) || {};
  if (Array.isArray(preset.plugins)) {
    preset.plugins = preset.plugins.filter(
      (plugin) => plugin !== 'react-native-worklets/plugin'
    );
  }
  return preset;
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', nativewindPreset],
    plugins: ['react-native-reanimated/plugin'],
  };
};
