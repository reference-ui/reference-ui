/**
 * Class-oriented patterns from the TypeScript handbook.
 *
 * Tasty currently emits **interfaces and type aliases** only; `class` declarations
 * are parsed but do not become manifest symbols. Each checklist row has a
 * same-named export that mirrors the **instance / public type surface** you would
 * document for Reference. Non-exported classes at the bottom exercise the parser.
 */

// --- class_implements ---
export interface BarForImplements {
  x: string
}
/** Instance shape analogous to `class Foo implements BarForImplements`. */
export interface ClassImplements extends BarForImplements {}

// --- class_extends_abstract ---
export interface AbstractBaseForClass {
  abstractMember(): void
}
/** Analogous to `class Concrete extends AbstractBase`. */
export interface ClassExtendsAbstract extends AbstractBaseForClass {
  concrete: string
}

// --- class_private_fields ---
/** Public type surface; `#field` and `private` members are not part of structural typing. */
export interface ClassPrivateFields {
  public: number
}

// --- class_static_members ---
/** Instance members; statics live on the constructor type (not modeled here as a class). */
export interface ClassStaticMembers {
  instance: string
}

// --- class_decorators ---
/** Decorators do not change the instance interface shape for typing tools. */
export interface ClassDecorators {
  value: number
}

// --- class_parameter_properties ---
/** Same fields as `constructor(public x: number, private y: string)`. */
export interface ClassParameterProperties {
  x: number
}

// Parser coverage (not indexed by Tasty)
class _ParserImplements implements BarForImplements {
  x = ''
}

abstract class _AbstractBase {
  abstract abs(): void
}

class _Concrete extends _AbstractBase {
  abs(): void {}
}

class _PrivateFields {
  #hidden = 1
  private priv = 2
  publicField = 3
}

class _Static {
  static count = 0
  static run(): void {}
}

function _deco(_: unknown): void {}
@_deco
class _Decorated {
  x = 1
}

class _ParameterProps {
  constructor(
    public x: number,
    private _y: string,
  ) {}
}
