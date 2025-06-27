import { DomScreen } from './dom_screen.ts';
import { ScreenLocator } from './screen_locator.ts';
import { Testing } from './testing.ts';

const describeLocator = (loc: ScreenLocator) => {
	if (isScreenRoot(loc)) {
		let msg = 'screen';
		const locs = loc.describe().join('.');
		if (locs !== '') {
			msg += `.${locs}`;
		}
		return msg;
	}

	let msg = Testing.stringify(loc.root, { maxWidth: 10 });
	const locs = loc.formatDescription();
	if (locs !== '') {
		msg += ` -> ${locs}`;
	}
	return msg;
};

function toMatchSelector(this: MatcherContext, receiver: unknown, selector: string): MatcherResult {
	const matcherName = 'toMatchSelector';
	const loc = verifyReceiver(receiver);

	const gotDirect = loc.allElements().filter((el) => el.matches(selector));
	const gotDesc = loc.locate(selector).allElements();

	const pass = gotDirect.length > 0 || gotDesc.length > 0;
	const message = () => {
		return [
			Testing.formatMatcher(matcherName, {
				...this,
				expected: selector,
				received: describeLocator(loc),
			}),
			'',
			`Expected: selector ${Testing.formatExpected(selector)} to${
				pass ? ' not' : ''
			} to match any element in the DOM root after applying locators`,
			`DOM root: ${Testing.formatReceived(loc.root)}`,
			`Locators: ${Testing.colorReceived(loc.formatDescription())}`,
			`Matched:  ${formatReceivedLocatorResults([...gotDirect, ...gotDesc])}`,
		].join('\n');
	};
	return { pass, message };
}

function toHaveClass(this: MatcherContext, receiver: unknown, className: string): MatcherResult {
	const matcherName = 'toHaveClass';
	const loc = verifyReceiver(receiver);
	// Allow specifying class names as space-separated strings.
	const classSel = `.${className
		.split(' ')
		.map((c) => c.trim())
		.join('.')}`;

	const gotDirect = loc.allElements().filter((el) => el.matches(classSel));
	const gotDesc = loc.locate(classSel).allElements();
	const pass = gotDirect.length > 0 || gotDesc.length > 0;

	const message = () => {
		return [
			Testing.formatMatcher(matcherName, {
				...this,
				expected: className,
				received: describeLocator(loc),
			}),
			'',
			`Expected: class names ${Testing.formatExpected(className)} to${
				pass ? ' not' : ''
			} match any element in the DOM root after applying locators`,
			`DOM root: ${Testing.formatReceived(loc.root)}`,
			`Locators: ${Testing.colorReceived(loc.formatDescription())}`,
			`Matched:  ${formatReceivedLocatorResults([...gotDirect, ...gotDesc])}`,
		].join('\n');
	};
	return { pass, message };
}

function toContainText(
	this: MatcherContext,
	receiver: unknown,
	text: string | RegExp,
): MatcherResult {
	const matcherName = 'toContainText';
	const loc = verifyReceiver(receiver);

	const gotDirect = loc.filterText(text).allElements();
	const pass = gotDirect.length > 0;

	const message = () => {
		const kind = typeof text === 'string' ? 'contain substring' : 'match regexp';
		return [
			Testing.formatMatcher(matcherName, {
				...this,
				expected: text.toString(),
				received: describeLocator(loc),
			}),
			'',
			`Expected: one element to ${kind} ${text} to${
				pass ? ' not' : ''
			} match DOM root node after applying locators`,
			`DOM root: ${Testing.formatReceived(loc.root)}`,
			`Locators: ${Testing.colorReceived(loc.formatDescription())}`,
			`Matched:  ${formatReceivedLocatorResults(gotDirect)}`,
		].join('\n');
	};
	return { pass, message };
}

function toHaveURLPath(this: MatcherContext, receiver: unknown, path: string): MatcherResult {
	const matcherName = 'toHaveURL';
	const loc = verifyReceiver(receiver);

	const doc = loc.root.ownerDocument;
	const gotURL = doc.URL;
	const gotPath = new URL(gotURL).pathname;
	const pass = gotPath === path;

	const message = () => {
		return [
			Testing.formatMatcher(matcherName, {
				...this,
				expected: path,
				received: describeLocator(loc),
			}),
			'',
			`Expected: URL ${Testing.formatExpected(path)} to${
				pass ? ' not' : ''
			} match the current page URL`,
			`Current URL: ${Testing.formatReceived(gotPath)}`,
		].join('\n');
	};
	return { pass, message };
}

function toHaveTitle(this: MatcherContext, receiver: unknown, title: string): MatcherResult {
	const matcherName = 'toHaveTitle';
	const loc = verifyReceiver(receiver);

	const doc = loc.root.ownerDocument;
	const gotTitle = doc.title;
	const pass = gotTitle === title;

	const message = () => {
		return [
			Testing.formatMatcher(matcherName, {
				...this,
				expected: title,
				received: describeLocator(loc),
			}),
			'',
			`Expected: title ${Testing.formatExpected(title)} to${
				pass ? ' not' : ''
			} match the current page title`,
			`Current title: ${Testing.formatReceived(gotTitle)}`,
		].join('\n');
	};
	return { pass, message };
}

function toBeInDocument(this: MatcherContext, receiver: unknown): MatcherResult {
	const matcherName = 'toBeInDocument';
	const loc = verifyReceiver(receiver);

	const pass = loc.allElements().length > 0;
	const message = () => {
		return [
			Testing.formatMatcher(matcherName, {
				...this,
				received: describeLocator(loc),
				expected: '',
			}),
			'',
			`Expected: to be in the document`,
			`DOM root: ${Testing.formatReceived(loc.root)}`,
			`Locators: ${Testing.colorReceived(loc.formatDescription())}`,
			`Matched:  ${formatReceivedLocatorResults(loc.allElements())}`,
		].join('\n');
	};
	return { pass, message };
}

/** Asserts that the Jest receiver is a supported type. */
const verifyReceiver = (receiver: unknown): ScreenLocator => {
	if (receiver instanceof DomScreen) {
		return receiver.locate('');
	}
	if (receiver instanceof ScreenLocator) {
		return receiver;
	}
	if (receiver instanceof Element) {
		return ScreenLocator.of(DomScreen.globalAct, receiver);
	}
	throw new Error(`Expected receiver to be a DomScreen or ScreenLocator, got ${receiver}`);
};

const isScreenRoot = (loc: ScreenLocator) => loc.root.tagName === 'DOM-SCREEN';

const formatReceivedLocatorResults = (elems: Element[]) => {
	if (elems.length === 0) {
		return Testing.colorReceived('no elements');
	}
	return Testing.formatReceived(elems.length === 1 ? elems[0] : elems);
};

type SyncMatcher<T> = (this: MatcherContext, receiver: unknown, args: T) => MatcherResult;

/**
 * Wraps a Jest matcher function to retry multiple times until the matcher
 * succeeds.
 */
const waitForSuccess = <T>(fn: SyncMatcher<T>): CustomMatcher<unknown, T[]> => {
	return async function (this: MatcherContext, receiver: unknown, arg: T): Promise<MatcherResult> {
		let resolve: (result: MatcherResult) => void;
		const p = new Promise<MatcherResult>((res) => {
			resolve = res;
		});
		await DomScreen.globalAct(async (): Promise<void> => {
			let result: MatcherResult | undefined;
			let sleepMillis = 5;
			for (let i = 0; i < 4; i++) {
				result = fn.call(this, receiver, arg);
				const success = this.isNot !== result.pass;
				if (success) {
					resolve(result);
					return;
				}
				await new Promise((r) => setTimeout(r, sleepMillis));
				sleepMillis *= 2;
			}
			// Should never happen since we run at least 1 loop iteration that
			// initializes the result.
			if (!result) throw new Error('result must be defined');
			resolve(result);
			return;
		});
		return p;
	};
};

export const screenMatchers = {
	toMatchSelector,
	toHaveClass,
	toContainText,
	toHaveURLPath: waitForSuccess(toHaveURLPath),
	toHaveTitle,
	toBeInDocument,
};
