import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  formatters: true,
  typescript: true,
  rules: {
    "ts/consistent-type-definitions": "off",
    "no-console": "off"
  }
})
