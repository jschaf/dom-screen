import type { RenderLifecycle } from 'dom-screen';
import React from 'react';
import * as ReactDOM from 'react-dom/client';

// React act checks for this global to be true.
declare global {
	// noinspection JSUnusedGlobalSymbols - global augmentation
	interface Window {
		IS_REACT_ACT_ENVIRONMENT: boolean;
	}
}

export const reactLifecycle: RenderLifecycle<ReactDOM.Root, React.ReactNode> = {
	createRoot: ReactDOM.createRoot,
	render: (root: ReactDOM.Root, node: React.ReactNode) => root.render(node),
	destroyRoot: (root: ReactDOM.Root) => root.unmount(),
	act: React.act,
};
