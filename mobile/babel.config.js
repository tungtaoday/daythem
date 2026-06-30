module.exports = function (api) {
  const isTest = api.env('test');
  // Cache per NODE_ENV so Jest (test) and Metro (dev/prod) each get correct output.
  api.cache.using(() => process.env.NODE_ENV);

  // Under Jest we use a minimal preset chain. babel-preset-expo's EXPO_PUBLIC env
  // inliner injects an ES `export` that Jest's CommonJS runtime can't parse, so we
  // avoid it in tests and transform TS/JSX + modules directly.
  if (isTest) {
    return {
      presets: [
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    };
  }

  // Metro (dev/prod) — full Expo preset (handles RN, Flow, EXPO_PUBLIC inlining).
  return {
    presets: ['babel-preset-expo'],
  };
};
