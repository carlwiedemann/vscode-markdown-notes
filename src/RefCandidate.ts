import { Ref } from './Ref';
import { RawRange } from "./RawRange";

export class RefCandidate {

  text: string;

  rawRange: RawRange;

  constructor(text: string, rawRange: RawRange) {
    this.text = text;
    this.rawRange = rawRange;
  }

  static fromMatch = (lineNum: number, match: RegExpMatchArray): RefCandidate => {
    let start = match.index || 0;
    let end = start + match[0].length;

    let rawRange: RawRange = {
      start: { line: lineNum, col: start },
      end: { line: lineNum, col: end },
    };

    return new RefCandidate(match[0], rawRange);
  };

  matchesRef(ref: Ref): boolean {
    return this.text == ref.fullText;
  }

}
