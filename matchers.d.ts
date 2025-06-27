// Ambient declaration for custom matchers to extend expect.
// noinspection JSUnusedGlobalSymbols
declare interface Matchers<R> {
	/**
	 * Asserts that the Element, Screen, or ScreenLocator matches exactly one
	 * element and that the element has a matching selector.
	 */
	toMatchSelector: (selector: string) => R;
	/**
	 * Asserts that the Element, Screen, or ScreenLocator matches exactly at
	 * least one element and that the element has a matching class name.
	 *
	 * To check for multiple classes, use a space-separated string. For
	 * example:
	 *
	 * ```ts
	 * expect(screen.locator('div')).toHaveClass('class1 class2');
	 * ```
	 */

	toHaveClass: (className: string) => R;
	/**
	 * Asserts that the Element, Screen, or ScreenLocator matches exactly one
	 * element and that element contains text.
	 *
	 *  - Checks the value attribute for input, textarea, and button elements.
	 *  - Checks textContent for other elements.
	 *
	 *  - If s is a string, asserts that the screen contains the substring.
	 *  - If s is a RegExp, asserts that the screen contains a match.
	 */
	toContainText: (s: string | RegExp) => R;

	/**
	 * Asynchronously asserts that the URL of the current page exactly matches
	 * the path.
	 */
	toHaveURLPath: (path: string) => Promise<R>;

	/** Asserts that the document title exactly matches the title. */
	toHaveTitle: (title: string) => R;

	/**
	 * Asserts that the located element appears in the document at least once.
	 */
	toBeInDocument: () => R;
}
