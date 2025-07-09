import { DomScreen } from 'dom-screen';
import React, { act } from 'react';

const domScreen = DomScreen.initTest({ act, expect, afterEach });

describe('domScreen.render', () => {
	test('simple', () => {
		const screen = domScreen.render(<div className="div-cls">Hello, world!</div>);
		expect(screen.locate('div')).toMatchSelector('.div-cls');
	});

	test('render twice', () => {
		domScreen.render(<div className="div-cls">Hello, world!</div>);
		domScreen.render(<div className="div-cls">Hello, world!</div>);
	});

	test('screen.locateText', () => {
		const screen = domScreen.render(
			<div>
				top
				<div>
					mid
					<div>bottom</div>
				</div>
			</div>,
		);
		expect(screen.locateText('bottom')).toContainText(/^bottom$/);
	});

	test('toHaveClass', () => {
		const screen = domScreen.render(<div className="div-cls">Hello, world!</div>);
		expect(screen).toHaveClass('div-cls');
		expect(screen.locate('.div-cls')).toHaveClass('div-cls');
		expect(screen.locate('div > div')).not.toHaveClass('div-cls');
		expect(screen.locate('div')).not.toHaveClass('not-found');
	});

	test('toMatchSelector', () => {
		const screen = domScreen.render(<div className="div-cls">Hello, world!</div>);
		expect(screen).toMatchSelector('div');
		expect(screen.locate('div')).toHaveClass('div-cls');
		expect(screen.locate('div')).toMatchSelector('div');
		expect(screen).not.toMatchSelector('p');
		expect(screen.locate('.foo')).not.toMatchSelector('div');
	});

	test('toHaveClass none', () => {
		const screen = domScreen.render(<div className="div-cls">Hello, world!</div>);
		expect(screen).toHaveClass('div-cls');
		expect(screen).not.toHaveClass('foo');
		expect(screen.locate('.foo')).not.toHaveClass('div-cls');
	});

	test('toContainText', () => {
		const screen = domScreen.render(<div className="div-cls">Hello, world!</div>);
		expect(screen).not.toContainText('Hello');
		expect(screen.locate('div')).toContainText('Hello');
		expect(screen.locate('div')).toContainText(/^Hello, world!$/);
		expect(screen.locate('div')).not.toContainText(/^world!$/);
	});

	test('fill input', () => {
		let val = '';
		const screen = domScreen.render(
			<input
				onChange={(e) => {
					val = e.target.value;
				}}
			/>,
		);
		const input = screen.locate('input');
		input.fill('Hello, world!');
		expect(input).toContainText('Hello, world!');
		expect(val).toBe('Hello, world!');
	});

	test('input press key', () => {
		const Input = () => {
			const [value, setValue] = React.useState('');
			return (
				<input
					value={value}
					onChange={(e) => {
						setValue(e.target.value);
					}}
				/>
			);
		};
		const screen = domScreen.render(<Input />);
		const input = screen.locate('input');
		input.press('F');
		expect(input).toContainText('F');

		// Don't add non-printable keys to the input value.
		input.press('Enter');
		expect(input).toContainText('F');
	});

	test('cleanup', () => {
		expect(self.IS_REACT_ACT_ENVIRONMENT).toBe(false);
		expect(document.body.childNodes.length).toBe(0);
	});
});
