import 'jest';
import { Tag } from "../../Tag";

describe('Tag.innerTextFromFullText', () => {

  it('converts as expected', () => {

    const fullText = 'hello';

    const content = Tag.innerTextFromFullText(fullText);

    expect(content).toBe('[#hello#]');
  });

  // it('handles escaped newlines', () => {
  //   const template = '# Title\\n\\nContent';
  //
  //   const content = newNote(template, 'nevermind');
  //
  //   expect(content).toBe('# Title\n\nContent');
  // });
  //
  // it('handles timestamp', () => {
  //   const template = '# Title\n\nCreated: ${timestamp}\n';
  //
  //   const content = newNote(template, 'nevermind');
  //   const regex = /# Title\n\nCreated: (.*)\n/;
  //
  //   expect(content).toMatch(regex);
  //   const matches = regex.exec(content);
  //   const date1 = Date.parse(matches![1]);
  //   expect(date1).not.toBe(Number.NaN);
  // });
  //
  // it('handles date', () => {
  //   const template = '# Title\nDate: ${date}\n';
  //
  //   const content = newNote(template, 'nevermind');
  //   const d = (new Date().toISOString().match(/(\d{4}-\d{2}-\d{2})/) || '')[0];
  //   const dt = `Date: ${d}`;
  //   expect(content.includes(dt)).toBeTruthy();
  // });
});

