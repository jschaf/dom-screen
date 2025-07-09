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
	private readonly cleanups: Array<() => void> = [];

	private constructor(readonly act: DomScreenAct) {
	}

	/**
	 * Adds custom expect matchers and registers cleanup after each test.
	 * Call at the top of the test file. For example:
	 *
	 * ```ts
	 * import { act } from 'react';
	 * import { DomScreen } from '//base/testing/web/dom_screen';
	 *
	 * const domScreen = DomScreen.initTest({ act, expect, afterEach });
	 * ```
	 */
	static initTest(opts: InitOpts): DomScreen {
		const screen = new DomScreen(opts.act);
		opts.expect.extend(screenMatchers);
		opts.afterEach(() => screen.cleanup());
		return screen;
	}

	/** Renders a React node in the DOM and returns the DomScreen. */
	render(node: ReactNode): ScreenLocator {
		if (!globalThis.document) {
			throw new Error(`document is not defined. Is jsdom or a similar library installed?`);
		}
		const baseElem = document.body;
		const container = document.createElement('dom-screen');
		baseElem.appendChild(container);

		self.IS_REACT_ACT_ENVIRONMENT = true;
		const root = ReactDOM.createRoot(container);
		this.cleanups.push(() => {
			root.unmount();
			if (!container.parentNode) {
				throw new Error(`container parentNode is null during cleanup.`);
			}
			container.parentNode.removeChild(container);
			// Attempt to clean up after tests.
			document.title = '';
		});
		const strictNode = React.createElement(React.StrictMode, null, node);
		this.act(() => root.render(strictNode));
		return ScreenLocator.of(this.act, container);
	}

	private cleanup(): void {
		self.IS_REACT_ACT_ENVIRONMENT = false;
		for (const cleanup of this.cleanups) {
			cleanup();
		}
		this.cleanups.length = 0;
	}
}
