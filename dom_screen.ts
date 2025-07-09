import type { ReactNode } from 'react';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ScreenLocator } from './screen_locator.ts';
import { screenMatchers } from './screen_matchers.ts';

export { ScreenLocator }

// React act checks for this global to be true.
declare global {
	// noinspection JSUnusedGlobalSymbols - global augmentation
	interface Window {
		IS_REACT_ACT_ENVIRONMENT: boolean;
	}
}

// React.act or similar. Define it to limit dependency on React.
type ActCallback<T extends void | Promise<void>> = () => T;
export type DomScreenAct = <T extends void | Promise<void>>(cb: ActCallback<T>) => T;
let globalAct: DomScreenAct; // initialized by DomScreen.initTest

// Global handlers to verify the test caller registers cleanup.
const isInit = (): boolean => globalAct != null;
// We could register the cleanup ourselves, but I dislike implicit modification
// of global state. Instead, validate implicitly but don't change state.
const initHintMsg: string = `
HINT: call DomScreen.initTest() at the top of the test file. For example:

   import { act } from 'react';
   import { DomScreen } from 'dom-screen';

   DomScreen.initTest({ act, expect, afterEach });
`;
const verifyCleanup = (): void => {
	if (!isInit()) {
		throw new Error(`DomScreen.init() not called in test file.${initHintMsg}`);
	}
};

// Most testing libraries define afterEach globally.
if (typeof afterEach === 'function') {
	afterEach(verifyCleanup);
}

interface InitOpts {
	/** React testing act function. */
	act: DomScreenAct;
	/** Jest expect function (or vitest in the future). */
	expect: typeof expect;
	/** Jest afterEach function (or vitest in the future). */
	afterEach: typeof afterEach;
}

export class DomScreen {
	/** Cleanup functions to run in afterEach. */
	private static cleanups: Array<() => void> = [];

	private readonly loc: ScreenLocator;

	private constructor(readonly container: Element) {
		this.loc = ScreenLocator.of(globalAct, container);
	}

	/** Global reference to the act function passed to DomScreen.initTest. */
	static globalAct<T extends void | Promise<void>>(cb: ActCallback<T>): T {
		if (!isInit()) {
			throw new Error(
				`DomScreen.initTest() not called before DomScreen.globalAct().${initHintMsg}`,
			);
		}
		return globalAct(cb);
	}

	/**
	 * Adds custom expect matchers and registers cleanup after each test.
	 * Call at the top of the test file. For example:
	 *
	 * ```ts
	 * import { act } from 'react';
	 * import { DomScreen } from '//base/testing/web/dom_screen';
	 *
	 * DomScreen.initTest({ act, expect, afterEach });
	 * ```
	 */
	static initTest(opts: InitOpts): void {
		if (isInit()) {
			return;
		}
		globalAct = opts.act;
		opts.expect.extend(screenMatchers);
		opts.afterEach(DomScreen.cleanup);
		globalThis.React = React;
	}

	/** Renders a React node in the DOM and returns the DomScreen. */
	static render(node: ReactNode): DomScreen {
		if (!isInit()) {
			throw new Error(`DomScreen.initTest() not called before DomScreen.render().${initHintMsg}`);
		}
		if (!globalThis.document) {
			throw new Error(`document is not defined. Is jsdom or a similar library installed?`);
		}
		const baseElem = document.body;
		const container = document.createElement('dom-screen');
		baseElem.appendChild(container);

		self.IS_REACT_ACT_ENVIRONMENT = true;
		const root = ReactDOM.createRoot(container);
		DomScreen.cleanups.push(() => {
			root.unmount();
			if (!container.parentNode) {
				throw new Error(`container parentNode is null during cleanup.`);
			}
			container.parentNode.removeChild(container);
			// Attempt to clean up after tests.
			document.title = '';
		});
		const strictNode = React.createElement(React.StrictMode, null, node);
		globalAct(() => root.render(strictNode));
		return new DomScreen(container);
	}

	private static cleanup(): void {
		self.IS_REACT_ACT_ENVIRONMENT = false;
		for (const cleanup of DomScreen.cleanups) {
			cleanup();
		}
		DomScreen.cleanups = [];
	}

	/** Returns a locator for all elements matching a selector. */
	locate(selector: string): ScreenLocator {
		return this.loc.locate(selector);
	}

	/** Returns a locator for all elements with a matching role. */
	locateRole(role: string) {
		return this.loc.locateRole(role);
	}

	/** Returns a locator of all elements that directly contains a substring. */
	locateText(s: string | RegExp): ScreenLocator {
		if (s instanceof RegExp) {
			return this.loc.locateText(s);
		}
		return this.loc.locateText(s);
	}
}
