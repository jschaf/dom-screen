/** Describes a group of related tests. */
interface Describe {
	(label: string, fn: () => void): void;
	/** Skips all other tests, except this group of tests. */
	only(label: string, fn: () => void): void;
}

/** Describes a group of related tests. */
declare const describe: Describe;

// biome-ignore lint/suspicious/noConfusingVoidType: cannot use undefined here
type VoidFunc = () => void | Promise<unknown>;

/** Runs a function after each test. Useful for cleanup tasks. */
declare function afterEach(fn: VoidFunc): void;

interface TestOptions {
	/** Sets the timeout for the test in milliseconds. Defaults to 5000 ms. */
	timeout?: number;
	/** Sets the number of times to retry the test if it fails. Defaults to 0. */
	retry?: number;
	/**
	 * Sets the number of times to repeat the test, regardless of whether it
	 * passed or failed. Defaults to 0.
	 */
	repeats?: number;
}
/** Runs a test. */
interface Test {
	(label: string, fn: VoidFunc, options?: TestOptions): void;
	/** Skips all other tests, except this test when run with the `--only` option. */
	only(label: string, fn: VoidFunc, options?: TestOptions): void;
}
/** Runs a test. */
declare const test: Test;

/** Asserts that a value matches some criteria. https://jestjs.io/docs/expect#reference */
declare const expect: Expect;

interface Expect extends AsymmetricMatchers {
	<T = unknown>(actual?: T, customFailMessage?: string): Matchers<T>;

	/** Access to negated asymmetric matchers. */
	not: AsymmetricMatchers;

	/** Create an asymmetric matcher for a promise resolved value. */
	resolvesTo: AsymmetricMatchers;

	/** Create an asymmetric matcher for a promise rejected value. */
	rejectsTo: AsymmetricMatchers;

	/** Register new custom matchers. */
	extend<M>(matchers: ExpectExtendMatchers<M>): void;
}

/**
 * You can extend this interface with declaration merging, in order to add type
 * support for custom matchers.
 */
interface Matchers<T = unknown> extends MatchersBuiltin<T> {}

/**
 * You can extend this interface with declaration merging, in order to add type
 * support for custom asymmetric matchers.
 */
interface AsymmetricMatchers extends AsymmetricMatchersBuiltin {}

interface AsymmetricMatchersBuiltin {
	/**
	 * Matches any array made up entirely of elements in the provided array.
	 * You can use it inside `toEqual` or `toBeCalledWith` instead of a literal value.
	 *
	 * Optionally, you can provide a type for the elements via a generic.
	 */
	arrayContaining<E>(arr: readonly E[]): AsymmetricMatcher;
	/**
	 * Matches any object that recursively matches the provided keys.
	 * This is often handy in conjunction with other asymmetric matchers.
	 *
	 * Optionally, you can provide a type for the object via a generic.
	 * This ensures that the object contains the desired structure.
	 */
	objectContaining(obj: object): AsymmetricMatcher;
	/**
	 * Matches any received string that contains the exact expected string
	 */
	stringContaining(str: string): AsymmetricMatcher;
	/**
	 * Matches any string that contains the exact provided string
	 */
	stringMatching(regex: string | RegExp): AsymmetricMatcher;
}

interface MatchersBuiltin<T = unknown> {
	/** Negates the result of a subsequent assertion. */
	not: Matchers;

	/** Expects the value to be a promise that resolves. */
	resolves: Matchers<Awaited<T>>;

	/** Expects the value to be a promise that rejects. */
	rejects: Matchers;

	/** Assertion which passes. */
	pass: (message?: string) => void;

	/** Assertion which fails. */
	fail: (message?: string) => void;

	/** Asserts that a value equals what is expected. */
	toBe(expected: T): void;

	/** Asserts that a value is deeply equal to what is expected. */
	toEqual(expected: T): void;

	/** Asserts that a value is deeply and strictly equal to what is expected. */
	toStrictEqual(expected: T): void;

	/** Asserts that a value has a `.length` property that is equal to the expected length. */
	toHaveLength(length: number): void;

	toBeDefined(): void;

	/** Asserts that a value is `undefined`. */
	toBeUndefined(): void;

	/** Asserts that a value is `null`. */
	toBeNull(): void;

	/** Asserts that a function throws an error. */
	toThrow(expected?: unknown): void;
}

interface MatcherResult {
	pass: boolean;
	message?: string | (() => string);
}

type CustomMatcher<E, P extends unknown[]> = (
	this: MatcherContext,
	expected: E,
	...matcherArguments: P
) => MatcherResult | Promise<MatcherResult>;

/** All non-builtin matchers and asymmetric matchers that have been type-registered through declaration merging */
type CustomMatchersDetected = Omit<Matchers, keyof MatchersBuiltin> &
	Omit<AsymmetricMatchers, keyof AsymmetricMatchersBuiltin>;

/**
 * If the types has been defined through declaration merging, enforce it.
 * Otherwise enforce the generic custom matcher signature.
 */
type ExpectExtendMatchers<M> = {
	[k in keyof M]: k extends keyof CustomMatchersDetected
		? CustomMatcher<unknown, Parameters<CustomMatchersDetected[k]>>
		: CustomMatcher<unknown, unknown[]>;
};

type EqualsFunction = (a: unknown, b: unknown) => boolean;

interface MatcherState {
	isNot: boolean;
	promise: string;
}

type MatcherHintColor = (arg: string) => string;

interface MatcherUtils {
	equals: EqualsFunction;
	utils: Readonly<{
		stringify(value: unknown): string;
		printReceived(value: unknown): string;
		printExpected(value: unknown): string;
		matcherHint(
			matcherName: string,
			received?: unknown,
			expected?: unknown,
			options?: {
				isNot?: boolean;
				promise?: string;
				isDirectExpectCall?: boolean; // (internal)
				comment?: string;
				expectedColor?: MatcherHintColor;
				receivedColor?: MatcherHintColor;
				secondArgument?: string;
				secondArgumentColor?: MatcherHintColor;
			},
		): string;
	}>;
}

type MatcherContext = MatcherUtils & MatcherState;
