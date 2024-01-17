import { Uri, CancellationToken, Location, Position, ProviderResult, ReferenceContext, ReferenceProvider, TextDocument } from 'vscode';
import {
  parse,
  SyntaxType,
  TextLocation,
} from '@creditkarma/thrift-parser';
import { genRange, ASTHelper } from './utils';


class ThriftReferenceProvider implements ReferenceProvider {
  genLocation(loc: TextLocation, filePath: string): Thenable<Location> {
    return Promise.resolve(
      new Location(
        Uri.file(filePath),
        genRange(loc)
      )
    );
  }

  public provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): ProviderResult<Location[]> {
    const wordRange = document.getWordRangeAtPosition(position);
    const word = document.getText(wordRange);

    const processor = (raw: string, filePath?: string): Thenable<Location[] | null> => {
      // search token in current file
      const thriftParseResult = parse(raw);
      if (thriftParseResult.type !== SyntaxType.ThriftDocument) {
        return Promise.resolve(null);
      }

      const astHelper = new ASTHelper(thriftParseResult, document);

      const nodes = astHelper.findNodesByWord(word);
      const locationList = nodes.map(item => {
        return this.genLocation(item.loc, filePath);
      });
      return Promise.all(locationList);
    };

    return processor(document.getText(), document.fileName);
  }
}

export default ThriftReferenceProvider;