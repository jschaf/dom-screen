import { DomScreen, type ScreenLocator } from 'dom-screen';
import { act } from 'react';

const domScreen = DomScreen.initTest({ act, expect, afterEach });

describe('ScreenLocator', () => {
	test('locate', () => {
		const screen = domScreen.render(
			<div>
				<p>Hi</p>
			</div>,
		);
		const locator = screen.locate('p');
		expect(locator).toBeDefined();
		expect(locator.element().tagName).toBe('P');
	});

	test('locateRole', () => {
		const screen = domScreen.render(
			<div>
				{/* biome-ignore lint/a11y/noRedundantRoles: find by role */}
				<input type="button" tabIndex={0} role="button" />
			</div>,
		);
		const elem = screen.locateRole('button').element();
		expect(elem.getAttribute('role')).toBe('button');
	});

	test('locateText', () => {
		const screen = domScreen.render(
			<div>
				Prefix
				<button type="button">Click me</button>
			</div>,
		);
		const elem = screen.locateText('me').element();
		expect(elem.getAttribute('type')).toBe('button');
	});

	test('first', () => {
		const screen = domScreen.render(
			<div id="id0">
				<div id="id1">1</div>
				<div id="id2">2</div>
			</div>,
		);
		const loc = screen.locate('div').first();
		assertLocatorMatchesIds(loc, ['id0']);
	});

	test('allElements', () => {
		const screen = domScreen.render(
			<div id="id0">
				<div id="id1">1</div>
				<div id="id2">2</div>
			</div>,
		);
		const loc = screen.locate('div');
		assertLocatorMatchesIds(loc, ['id0', 'id1', 'id2']);

		const all = loc.allElements();
		expect(all[0]).not.toContainText('1');
		expect(all[1]).toContainText('1');
		expect(all[1]).not.toContainText('2');
		expect(all[2]).toContainText('2');
		expect(all[2]).not.toContainText('1');

		expect(all[0]).toMatchSelector('div');
		expect(all[1]).toMatchSelector('div');
		expect(all[2]).toMatchSelector('div');
	});

	test('filterText', () => {
		const screen = domScreen.render(
			<div id="a">
				alpha
				<div id="ab">alpha bravo</div>
				<div id="abc">alpha bravo charlie</div>
				<div id="abcd">alpha bravo charlie delta</div>
			</div>,
		);
		const alphaLoc = screen.locateText('alpha');
		assertLocatorMatchesIds(alphaLoc, ['a', 'ab', 'abc', 'abcd']);
		assertLocatorMatchesIds(alphaLoc.filterText('bravo'), ['ab', 'abc', 'abcd']);
		assertLocatorMatchesIds(alphaLoc.locateText('delta'), ['abcd']);

		const bravoLoc = screen.locateText('bravo');
		assertLocatorMatchesIds(bravoLoc, ['ab', 'abc', 'abcd']);
		assertLocatorMatchesIds(bravoLoc.filterText('alpha'), ['ab', 'abc', 'abcd']);
		assertLocatorMatchesIds(bravoLoc.filterText('charlie'), ['abc', 'abcd']);
		assertLocatorMatchesIds(bravoLoc.locateText('delta'), []);
	});

	test('describe', () => {
		const screen = domScreen.render(<div />);
		const loc = screen.locateText('alpha').filterText('bravo').locate('div');
		const got = loc.describe();
		expect(got).toEqual(['locateText(alpha)', 'filterText(bravo)', 'locate(div)']);
	});

	test('formatDescription', () => {
		const screen = domScreen.render(<div />);
		const loc = screen.locateText('alpha').filterText('bravo').locateRole('qux').locate('p > #id');
		const got = loc.formatDescription();
		expect(got).toBe(
			'locateText(alpha) -> filterText(bravo) -> locateRole(qux) -> locate(p > #id)',
		);
	});

	test('expect.toContainText', () => {
		const screen = domScreen.render(
			<div>
				Prefix <div>Hello</div>
			</div>,
		);
		const loc = screen.locate('div');
		expect(loc).toContainText('Hello');
		expect(loc.locateText('Hello')).toContainText('Hello');
		expect(screen).not.toContainText('hi');
	});
});

const assertLocatorMatchesIds = (loc: ScreenLocator, ids: string[]) => {
	const all = loc.allElements();
	const gotIds = all.map((el) => el.id);
	expect(gotIds).toEqual(ids);
};
