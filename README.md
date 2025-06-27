# dom-screen

Zero-dependency, straightforward DOM assertion library without a paid class
offering.

### Example

```tsx
import React, { act } from 'react';
import { DomScreen } from 'dom-screen';

DomScreen.initTest({ act, expect, afterEach });

describe('DomScreen.render', () => {
  test('simple', () => {
    const screen = DomScreen.render(<div className="div-cls">Hello, world!</div>);
    expect(screen).toHaveClass('div-cls');
    expect(screen.locate('div')).toMatchSelector('.div-cls');
    expect(screen).not.toHaveClass('foo');
  });
});
```
