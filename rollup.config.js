import { createFoundryConfigWithDir } from '@rayners/foundry-dev-tools/rollup';

export default createFoundryConfigWithDir({
  cssFileName: 'styles/journeys-and-jamborees.css',
  additionalCopyTargets: [
    { src: 'templates/partials/*.hbs', dest: 'dist/templates/partials/' },
    { src: 'templates/parts/*.hbs', dest: 'dist/templates/parts/' },
    { src: 'assets/**/*', dest: 'dist/' }
  ],
  scssOptions: {
    includePaths: ['styles']
  },
  devServerPort: 29999
});
