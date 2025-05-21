import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import scss from 'rollup-plugin-scss';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

export default [
  {
    input: 'src/module.ts',
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript(),
      scss({
        fileName: 'styles/journeys-and-jamborees.css',
        sourceMap: true,
        watch: 'styles',
        // outputStyle: 'compressed',
        includePaths: ['styles'],
        failOnError: true, // This will make the build fail if there's an SCSS error
      }),
      copy({
        targets: [
          { src: 'module.json', dest: 'dist/' },
          { src: 'templates/*.hbs', dest: 'dist/templates/' },
          { src: 'templates/partials/*.hbs', dest: 'dist/templates/partials/' },
          { src: 'assets/**/*', dest: 'dist/' },
          { src: 'languages/*.json', dest: 'dist/languages/' },
        ],
      }),
      process.env.SERVE === 'true' && serve({
        contentBase: 'dist',
        port: 29999,
      }),
      process.env.SERVE === 'true' && livereload('dist'),
    ],
  },
];
