import { DefaultVisitor } from './default';
import { TargetLanguage } from './target-language';

export interface DartLanguageContext {
  /**
   * Whether we're currently rendering a parameter in tail position
   *
   * If so, and the parameter is of type struct, explode it to keyword args
   * and return its information in `returnExplodedParameter`.
   */
  readonly tailPositionParameter?: boolean;

  // TODO: Buncha more stuff prob, adhoc inteface to use somewhere
}

export class DartVisitor extends DefaultVisitor<DartLanguageContext> {
  /**
   * Translation version
   *
   * Bump this when you change something in the implementation to invalidate
   * existing cached translations.
   */
  public static readonly VERSION = '2';

  public readonly defaultContext = {};

  public language: TargetLanguage = TargetLanguage.DART;

  public mergeContext(old: DartLanguageContext, update: Partial<DartLanguageContext>): DartLanguageContext {
    return Object.assign({}, old, update);
  }
}
