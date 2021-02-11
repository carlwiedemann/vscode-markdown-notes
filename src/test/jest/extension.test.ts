import 'jest';
import { Tag } from "../../Tag";

describe('Tag.innerTextFromFullText', () => {

  it('converts full text as expected', () => {

    const fullText = '[#hello#]';
    const expected = 'hello';

    const actual = Tag.innerTextFromFullText(fullText);

    expect(actual).toBe(expected);
  });

  it('converts inner text as expected', () => {

    const innerText = 'hello';
    const expected = '[#hello#]';

    const actual = Tag.fullTextFromInnerText(innerText);

    expect(actual).toBe(expected);
  });

});