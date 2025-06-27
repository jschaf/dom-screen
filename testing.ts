import * as prettyFormat from 'pretty-format';
import { tty } from './tty.ts';

export const Testing = {
	/** Stringify a value using pretty formatting. */
	stringify(value: unknown, opts?: { maxWidth?: number }): string {
		return prettyFormat.format(value, {
			maxDepth: opts?.maxWidth ?? 10,
			maxWidth: opts?.maxWidth ?? 80,
			min: true,
			plugins: [
				prettyFormat.plugins.ReactTestComponent,
				prettyFormat.plugins.ReactElement,
				prettyFormat.plugins.DOMElement,
				prettyFormat.plugins.DOMCollection,
				prettyFormat.plugins.AsymmetricMatcher,
			],
		});
	},

	/** Canonically format a testing assertion. */
	formatMatcher(
		matcherName: string,
		opts: { received: string; expected: string; isNot?: boolean },
	): string {
		const { received, expected, isNot } = opts;
		let hint = '';
		hint += tty.dim(`expect(`);
		hint += tty.red(received);
		hint += tty.dim(`)`);
		if (isNot) {
			hint += tty.dim(`.not`);
		}
		hint += tty.dim(`.${matcherName}(`);
		hint += tty.green(expected);
		hint += tty.dim(`)`);
		return hint;
	},

	/** Color a value as the received (got) value in a testing assertion. */
	colorReceived(val: string): string {
		return tty.red(val);
	},

	/**
	 * Stringify and color a value as the received (got) value in a testing
	 * assertion.
	 */
	formatReceived(val: unknown): string {
		return Testing.colorReceived(Testing.stringify(val));
	},

	/** Color a value as the expected (want) value in a testing assertion. */
	colorExpected(val: string): string {
		return tty.green(val);
	},

	/**
	 * Stringify and color a value as the expected (want) value in a testing
	 * assertion.
	 */
	formatExpected(val: unknown): string {
		return Testing.colorExpected(Testing.stringify(val));
	},
};
