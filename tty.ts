/** TTY color functions for terminal output. */
export const tty = {
	red(s: string): string {
		return s === '' ? s : `\u001b[31m${s}\u001b[39m`;
	},
	green(s: string): string {
		return s === '' ? s : `\u001b[32m${s}\u001b[39m`;
	},
	dim(s: string): string {
		return s === '' ? s : `\u001b[2m${s}\u001b[22m`;
	},
};
