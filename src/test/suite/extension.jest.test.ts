import 'jest';
import { foo, NoteWorkspace } from '../../NoteWorkspace';
import { titleCaseFilename } from '../../utils';
import { ReferenceSearch } from '../../ReferenceSearch';
import { ContextWordType } from '../../ContextWord';

test('foo', () => {
  expect(foo()).toBe(1);
});

test('rxWikiLink', () => {
  let rx = NoteWorkspace.rxWikiLink();
  expect(('Some [[wiki-link]].'.match(rx) || [])[0]).toEqual('[[wiki-link]]');
  expect(('Some [[wiki link]].'.match(rx) || [])[0]).toEqual('[[wiki link]]');
  expect(('Some [[wiki-link.md]].'.match(rx) || [])[0]).toEqual('[[wiki-link.md]]');
  expect('Some [[wiki-link.md].').not.toMatch(rx);
});

test('noteNamesFuzzyMatch', () => {
  expect(
    NoteWorkspace.noteNamesFuzzyMatch('dir/sub/the-heat-is-on.md', 'the-heat-is-on.md')
  ).toBeTruthy();
  expect(
    NoteWorkspace.noteNamesFuzzyMatch('dir/sub/the-heat-is-on.md', 'the-heat-is-on')
  ).toBeTruthy();
  expect(
    NoteWorkspace.noteNamesFuzzyMatch('dir/sub/the-heat-is-on.markdown', 'the-heat-is-on')
  ).toBeTruthy();
  expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki-link.md]]', 'wiki-link.md')).toBeTruthy();
  expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki-link]]', 'wiki-link.md')).toBeTruthy();
  expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki link]]', 'wiki-link.md')).toBeTruthy();
});

test('noteNamesFuzzyMatch', () => {
  expect(NoteWorkspace._wikiLinkCompletionForConvention('toSpaces', 'the-note-name.md')).toEqual(
    'the note name'
  );
  expect(NoteWorkspace._wikiLinkCompletionForConvention('noExtension', 'the-note-name.md')).toEqual(
    'the-note-name'
  );
  expect(NoteWorkspace._wikiLinkCompletionForConvention('rawFilename', 'the-note-name.md')).toEqual(
    'the-note-name.md'
  );
});

test('titleCaseFilename', () => {
  expect(titleCaseFilename('the-heat-is-on.md')).toEqual('The Heat Is On');
  expect(titleCaseFilename('in-the-heat-of-the-night.md')).toEqual('In the Heat of the Night');
});

let document = `line0 word1
line1 word1 word2 
  [[test.md]]  #tag #another_tag  <- link at line2, chars 2-12
^ tags at line2 chars 15-19 and 21-32
[[test.md]] <- link at line4, chars 0-11
[[demo.md]] <- link at line5, chars 0-11
#tag word`; // line 5, chars 0-3

// FIXME: convert this to an output that does not really on vscode.Range
// test('ReferenceSearch.rangesForWordInDocumentData', () => {
//   let w = {
//     word: 'test.md',
//     hasExtension: true,
//     type: ContextWordType.WikiLink,
//     range: undefined,
//   };
//   expect(ReferenceSearch.rangesForWordInDocumentData(w, document)).toMatchObject([
//     new vscode.Range(2, 2, 2, 13),
//     new vscode.Range(4, 0, 4, 11),
//   ]);
//   w = {
//     word: 'tag',
//     hasExtension: true,
//     type: ContextWordType.Tag,
//     range: undefined,
//   };
//   expect(ReferenceSearch.rangesForWordInDocumentData(w, document)).toMatchObject([
//     new vscode.Range(2, 15, 2, 19),
//     new vscode.Range(6, 0, 6, 4),
//   ]);
// });