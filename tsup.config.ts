import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/react/calendar.tsx', 'src/react/date-picker.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: true,
  target: 'es2021',
  treeshake: true,
})
