import { createFoundryConfigWithDir } from '@rayners/foundry-dev-tools/rollup/foundry-config.js';

export default createFoundryConfigWithDir({
  cssFileName: 'styles/journeys-and-jamborees.css',
  additionalCopyTargets: [
    { src: 'templates/partials/*.hbs', dest: 'dist/templates/partials/' },
    { src: 'assets/**/*', dest: 'dist/' }
  ],
  scssOptions: {
    includePaths: ['styles']
  },
  devServerPort: 29999
});
