
import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: 'http://localhost:3000/api/json',
    output: {
      target: './src/lib/api/generated.ts',
      client: 'react-query',
      mode: 'tags-split',
      override: {
        mutator: {
          path: './src/lib/axios.ts',
          name: 'backendApi',
        },
      },
    },
  },
});
