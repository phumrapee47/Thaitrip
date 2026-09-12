module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Required by react-native-reanimated v4 (Province Tile unlock animation, T16/T17).
    plugins: ['react-native-worklets/plugin'],
  };
};
