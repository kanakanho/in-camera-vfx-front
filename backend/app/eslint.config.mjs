import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  ignores: ['zzz'],
  rules: {
    'no-console': 'off',
  },
})
