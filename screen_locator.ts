import type { DomScreenAct } from './dom_screen.ts';
import { KeyPress } from './keypress.ts';

/**
 * A function that, given a set of elements, returns a new set of elements by
 * filtering or locating descendant elements matching some criterion.
 */
type Matcher = (set: Set<Element>) => Set<Element>;

interface LocatorMatcher {
	description: string;
	match: Matcher;
}

/**
 * ScreenLocator is an immutable class that lazily finds DOM elements on a
 * screen. The locators and filters are chained together and only executed when
 * the elements are necessary.
 */
export class ScreenLocator {
	private constructor(
		readonly act: DomScreenAct,
		readonly root: Element,
		private readonly matchers: LocatorMatcher[],
	) {}

	static of(act: DomScreenAct, element: Element) {
		return new ScreenLocator(act, element, []);
	}

	/**
	 * Returns a ScreenLocator of all descendant elements matching the
	 * query selector.
	 */
	locate(selector: string): ScreenLocator {
		if (selector === '') {
			return this;
		}
		return this.chainLocator(`locate(${selector})`, (prev) => matchQuerySelector(prev, selector));
	}

	/**
	 * Returns a ScreenLocator that filters elements matched by the current
	 * locator.
	 */
	filterText(s: string | RegExp): ScreenLocator {
		return this.chainLocator(`filterText(${s})`, (prev) => filterText(prev, s));
	}

	/**
	 * Returns a ScreenLocator of all descendant elements that have a
	 * matching role.
	 */
	locateRole(role: string): ScreenLocator {
		return this.chainLocator(`locateRole(${role})`, (prev) => matchRole(prev, role));
	}

	/**
	 * Returns a new ScreenLocator of all descendant elements that directly
	 * contain substring in the element textContent.
	 */
	locateText(s: string | RegExp): ScreenLocator {
		if (s instanceof RegExp) {
			return this.chainLocator(`locateText(regexp: ${s})`, (prev) => matchRegExp(prev, s));
		}
		return this.chainLocator(`locateText(${s})`, (prev) => matchText(prev, s));
	}

	/** Returns a new ScreenLocator of the first element found. */
	first(): ScreenLocator {
		return this.chainLocator('first()', (prev): Set<Element> => {
			if (prev.size === 0) {
				return new Set();
			}
			const elem = prev.values().next().value;
			if (elem === undefined) {
				throw new Error('No elements found');
			}
			return new Set([elem]);
		});
	}

	/** Returns a string array description of how the locator finds elements. */
	describe(): string[] {
		return this.matchers.map((m) => m.description);
	}

	/** Returns a formatted string describing how the locator finds elements. */
	formatDescription(): string {
		return this.describe().join(' -> ');
	}

	/** Returns all elements found by the locators. */
	allElements(): Element[] {
		let found = new Set<Element>([this.root]);
		for (const { match } of this.matchers) {
			found = match(found);
		}
		return Array.from(found);
	}

	/**
	 * Returns the only element located.
	 * Errors if the locators return zero or more than one element.
	 */
	element(): Element {
		const elems = this.allElements();
		if (elems.length === 0) {
			throw new Error(`no elements found but expected one: ${this.formatDescription()}`);
		}
		if (elems.length > 1) {
			throw new Error(`multiple elements found but expected one: ${this.formatDescription()}`);
		}
		return elems[0];
	}

	/** Clicks the first element found by the locator. */
	click(): void {
		const elems = this.allElements();
		if (elems.length === 0) {
			throw new Error(`no elements found to click: ${this.formatDescription()}`);
		}
		if (elems.length > 1) {
			throw new Error(`multiple elements found to click: ${this.formatDescription()}`);
		}
		const elem = elems[0];
		this.act((): void => {
			elem.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
			elem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			elem.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
		});
	}

	/** Presses a single key on the first element found. */
	press(key: keyof typeof KeyPress): void {
		const elems = this.allElements();
		if (elems.length === 0) {
			throw new Error(`no elements found to press: ${this.formatDescription()}`);
		}
		if (elems.length > 1) {
			throw new Error(`multiple elements found to press: ${this.formatDescription()}`);
		}
		const elem = elems[0];
		if (
			!(elem instanceof HTMLInputElement) &&
			!(elem instanceof HTMLTextAreaElement) &&
			!(elem instanceof HTMLSelectElement)
		) {
			throw new Error(`cannot press key on tag: ${elem.tagName.toLowerCase()}`);
		}
		const keyEv = KeyPress[key];
		if (keyEv === undefined) {
			throw new Error(`unknown key: ${key}; maybe not yet added to KeyPress?`);
		}
		this.act((): void => {
			elem.focus();
			elem.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
			elem.dispatchEvent(new KeyboardEvent('keydown', keyEv));
			elem.dispatchEvent(new KeyboardEvent('keyup', keyEv));
			if (isPrintable(keyEv.keyCode)) {
				setElementValue(elem, (old) => old + keyEv.key);
			}
			elem.dispatchEvent(new KeyboardEvent('keypress', keyEv));
			elem.dispatchEvent(new Event('input', { bubbles: true }));
			elem.dispatchEvent(new Event('change', { bubbles: true }));
		});
	}

	/** Fills out a form field. */
	fill(value: string) {
		const elems = this.allElements();
		if (elems.length === 0) {
			throw new Error(`no elements found to fill: ${this.formatDescription()}`);
		}
		if (elems.length > 1) {
			throw new Error(`multiple elements found to fill: ${this.formatDescription()}`);
		}
		const elem = elems[0];
		if (
			!(elem instanceof HTMLInputElement) &&
			!(elem instanceof HTMLTextAreaElement) &&
			!(elem instanceof HTMLSelectElement)
		) {
			throw new Error(`cannot fill out tag: ${elem.tagName.toLowerCase()}`);
		}

		this.act((): void => {
			elem.focus();
			elem.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
			setElementValue(elem, () => value);
			elem.dispatchEvent(new Event('input', { bubbles: true }));
			elem.dispatchEvent(new Event('change', { bubbles: true }));
			elem.blur();
			elem.dispatchEvent(
				new FocusEvent('blur', {
					bubbles: true,
					cancelable: false,
					composed: true,
				}),
			);
		});
	}

	blur() {
		const elems = this.allElements();
		if (elems.length === 0) {
			throw new Error(`no elements found to fill: ${this.formatDescription()}`);
		}
		if (elems.length > 1) {
			throw new Error(`multiple elements found to fill: ${this.formatDescription()}`);
		}
		const elem = elems[0];
		this.act((): void => {
			if (elem instanceof HTMLElement) {
				elem.blur();
			}
			elem.dispatchEvent(
				new FocusEvent('blur', {
					bubbles: true,
					cancelable: false,
					composed: true,
				}),
			);
		});
	}

	private chainLocator(description: string, match: Matcher): ScreenLocator {
		return new ScreenLocator(this.act, this.root, [...this.matchers, { description, match }]);
	}
}

/** Matches all elements descendant from the root where isMatch is true. */
const matchDescendants = (prev: Set<Element>, isMatch: (_: Element) => boolean): Set<Element> => {
	const results = new Set<Element>();
	for (const e of prev) {
		for (const d of e.querySelectorAll('*')) {
			if (isMatch(d)) {
				results.add(d);
			}
		}
	}
	return results;
};

/** Matches all elements selected by the selector. */
const matchQuerySelector = (prev: Set<Element>, selector: string): Set<Element> => {
	const results = new Set<Element>();
	for (const e of prev) {
		const descendants = e.querySelectorAll(selector);
		for (const d of descendants) {
			results.add(d);
		}
	}
	return results;
};

const matchText = (prev: Set<Element>, text: string): Set<Element> => {
	return matchDescendants(prev, (e) => getNormalizedText(e).includes(text));
};

const matchRegExp = (prev: Set<Element>, re: RegExp): Set<Element> => {
	return matchDescendants(prev, (e) => re.test(getNormalizedText(e)));
};

/** Matches all elements containing matching role. */
const matchRole = (prev: Set<Element>, role: string): Set<Element> => {
	return matchDescendants(prev, (e) => {
		// Note: Playwright filters out invalid roles.
		// https://www.w3.org/TR/wai-aria-1.2/#role_definitions
		// https://www.w3.org/TR/wai-aria-1.2/#abstract_roles
		// Additionally, Playwright uses implicit roles, like href for <a> tags,
		// if there are no explicit roles.
		const attr: string = e.getAttribute('role') ?? '';
		const roles = attr.split(' ').map((r) => r.trim());
		return roles.includes(role);
	});
};

const filterText = (prev: Set<Element>, s: string | RegExp): Set<Element> => {
	const results = new Set<Element>();
	for (const e of prev) {
		const isFound =
			typeof s === 'string' ? getNormalizedText(e).includes(s) : s.test(getNormalizedText(e));

		if (isFound) {
			results.add(e);
		}
	}
	return results;
};

/** Returns the text of a node, not including descendant nodes. */
const getNormalizedText = (node: Element): string => {
	if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
		return (node as unknown as HTMLInputElement).value;
	}
	let s = '';
	for (const child of node.childNodes) {
		if (child.nodeType === Node.TEXT_NODE) {
			s += child.textContent ?? '';
		}
	}
	return normalizeWhitespace(s);
};

const normalizeWhitespace = (s: string): string => s.replace(/\s+/g, ' ').trim();

/**
 * Returns true if the key code is a printable character.
 * https://www.ascii-code.com/characters/printable-characters
 */
const isPrintable = (keyCode: number) => {
	return 33 <= keyCode && keyCode < 127;
};

/**
 * Set the element's value attribute directly, using a setter. Necessary for
 * React to see the new value (after firing the change event).
 * https://github.com/facebook/react/issues/10135#issuecomment-401496776
 * https://github.com/testing-library/react-testing-library/issues/152
 */
const setElementValue = (
	element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
	setValue: (old: string) => string,
) => {
	const directSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
	const prototype = Object.getPrototypeOf(element);
	const prototypeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
	if (prototypeSetter && directSetter !== prototypeSetter) {
		prototypeSetter.call(element, setValue(element.value));
		return;
	}
	if (directSetter) {
		directSetter.call(element, setValue(element.value));
	}
	throw new Error('element does not have a value setter');
};
