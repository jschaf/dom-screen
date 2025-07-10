import { ScreenLocator } from './screen_locator.ts';
import { screenMatchers } from './screen_matchers.ts';

export { ScreenLocator, screenMatchers };

// React.act or similar. Define it to limit dependency on React.
type ActCallback<T extends void | Promise<void>> = () => T;
export type DomScreenAct = <T extends void | Promise<void>>(cb: ActCallback<T>) => T;

export interface RenderLifecycle<ROOT, NODE> {
	/** Creates a root from a container element to use for rendering. */
	createRoot: (container: Element) => ROOT;
	/** Renders a node in the root. */
	render: (root: ROOT, node: NODE) => void;
	/** Destroys the root and cleans up after rendering. */
	destroyRoot: (root: ROOT) => void;
	/** Runs an action in a controlled environment. */
	act: DomScreenAct;
}

interface InitOpts<ROOT, NODE> {
	lifecycle: RenderLifecycle<ROOT, NODE>;
	/** Jest afterEach function (or vitest in the future). */
	afterEach: typeof afterEach;
}

export class DomScreen<ROOT, NODE> {
	/** Cleanup functions to run in afterEach. */
	private readonly cleanups: Array<() => void> = [];

	private constructor(readonly lifecycle: RenderLifecycle<ROOT, NODE>) {}

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
	static initTest<ROOT, NODE>(opts: InitOpts<ROOT, NODE>): DomScreen<ROOT, NODE> {
		const screen = new DomScreen(opts.lifecycle);
		opts.afterEach(() => screen.cleanup());
		return screen;
	}

	/** Renders a React node in the DOM and returns the DomScreen. */
	render(node: NODE): ScreenLocator {
		if (!globalThis.document) {
			throw new Error(`document is not defined. Is jsdom or a similar library installed?`);
		}

		const baseElem = document.body;
		const container = document.createElement('dom-screen');
		baseElem.appendChild(container);
		const root = this.lifecycle.createRoot(container);

		this.lifecycle.act(() => {
			this.lifecycle.render(root, node);
		});

		this.cleanups.push(() => {
			this.lifecycle.act(() => this.lifecycle.destroyRoot(root));
			if (!container.parentNode) {
				throw new Error(`container parentNode is null during cleanup.`);
			}
			container.parentNode.removeChild(container);
			// Attempt to clean up after tests.
			document.title = '';
		});

		return ScreenLocator.of(this.lifecycle.act, container);
	}

	private cleanup(): void {
		for (const cleanup of this.cleanups) {
			cleanup();
		}
		this.cleanups.length = 0;
	}
}
