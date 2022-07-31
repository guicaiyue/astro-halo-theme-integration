import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  externals: ["astro"],
  rollup: {
    emitCJS: true,
  },
})
