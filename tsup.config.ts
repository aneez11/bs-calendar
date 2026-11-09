import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/react/calendar.tsx', 'src/react/date-picker.tsx'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    splitting: true,
    target: 'es2021',
    treeshake: true,
  },
  {
    entry: { 'nepali-datepicker': 'src/global.tsx' },
    format: ['iife'],
    globalName: 'NepaliDatePicker',
    outDir: 'dist/global',
    dts: false,
    clean: false,
    minify: true,
    platform: 'browser',
    target: 'es2021',
    treeshake: true,
    noExternal: [/^react/],
    define: { 'process.env.NODE_ENV': '"production"' },
  },
])
