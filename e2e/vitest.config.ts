import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['*_test.tsx'],
		globals: true,
		setupFiles: ['./init_dom.ts'],
	},
});
