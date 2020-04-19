// Generated from app/src/lang/Reactive.g4 by ANTLR 4.6-SNAPSHOT
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { Lexer } from "antlr4ts/Lexer";
import { LexerATNSimulator } from "antlr4ts/atn/LexerATNSimulator";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";
import * as Utils from "antlr4ts/misc/Utils";

export class ReactiveLexer extends Lexer {
    // tslint:enable:no-trailing-whitespace
    constructor(input) {
        super(input);
        this._interp = new LexerATNSimulator(ReactiveLexer._ATN, this);
    }
    // @Override
    // @NotNull
    get vocabulary() {
        return ReactiveLexer.VOCABULARY;
    }
    // @Override
    get grammarFileName() {
        return "Reactive.g4";
    }
    // @Override
    get ruleNames() {
        return ReactiveLexer.ruleNames;
    }
    // @Override
    get serializedATN() {
        return ReactiveLexer._serializedATN;
    }
    // @Override
    get modeNames() {
        return ReactiveLexer.modeNames;
    }
    static get _ATN() {
        if (!ReactiveLexer.__ATN) {
            ReactiveLexer.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(ReactiveLexer._serializedATN));
        }
        return ReactiveLexer.__ATN;
    }
}
ReactiveLexer.T__0 = 1;
ReactiveLexer.T__1 = 2;
ReactiveLexer.T__2 = 3;
ReactiveLexer.Identifier = 4;
ReactiveLexer.NonzeroDigit = 5;
ReactiveLexer.DigitSequence = 6;
ReactiveLexer.FractionalConstant = 7;
ReactiveLexer.ExponentPart = 8;
ReactiveLexer.PLUS = 9;
ReactiveLexer.MINUS = 10;
ReactiveLexer.MULTIPLY = 11;
ReactiveLexer.DIVIDE = 12;
ReactiveLexer.NOT = 13;
ReactiveLexer.GT = 14;
ReactiveLexer.GTE = 15;
ReactiveLexer.LT = 16;
ReactiveLexer.LTE = 17;
ReactiveLexer.EQUALS = 18;
ReactiveLexer.NOT_EQUALS = 19;
ReactiveLexer.AND = 20;
ReactiveLexer.OR = 21;
ReactiveLexer.DOT = 22;
ReactiveLexer.OPEN_BRACKET = 23;
ReactiveLexer.CLOSED_BRACKET = 24;
ReactiveLexer.Whitespace = 25;
// tslint:disable:no-trailing-whitespace
ReactiveLexer.modeNames = [
    "DEFAULT_MODE",
];
ReactiveLexer.ruleNames = [
    "T__0", "T__1", "T__2", "Identifier", "IdentifierNondigit", "Nondigit",
    "Digit", "NonzeroDigit", "DigitSequence", "FractionalConstant", "Sign",
    "ExponentPart", "PLUS", "MINUS", "MULTIPLY", "DIVIDE", "NOT", "GT", "GTE",
    "LT", "LTE", "EQUALS", "NOT_EQUALS", "AND", "OR", "DOT", "OPEN_BRACKET",
    "CLOSED_BRACKET", "Whitespace",
];
ReactiveLexer._LITERAL_NAMES = [
    undefined, "'0'", "'true'", "'false'", undefined, undefined, undefined,
    undefined, undefined, "'+'", "'-'", "'*'", "'/'", "'!'", "'>'", "'>='",
    "'<'", "'<='", "'=='", "'!='", "'&&'", "'||'", "'.'", "'('", "')'",
];
ReactiveLexer._SYMBOLIC_NAMES = [
    undefined, undefined, undefined, undefined, "Identifier", "NonzeroDigit",
    "DigitSequence", "FractionalConstant", "ExponentPart", "PLUS", "MINUS",
    "MULTIPLY", "DIVIDE", "NOT", "GT", "GTE", "LT", "LTE", "EQUALS", "NOT_EQUALS",
    "AND", "OR", "DOT", "OPEN_BRACKET", "CLOSED_BRACKET", "Whitespace",
];
ReactiveLexer.VOCABULARY = new VocabularyImpl(ReactiveLexer._LITERAL_NAMES, ReactiveLexer._SYMBOLIC_NAMES, []);
ReactiveLexer._serializedATN = "\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x02\x1B\xA4\b\x01" +
    "\x04\x02\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06" +
    "\x04\x07\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r" +
    "\t\r\x04\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t" +
    "\x12\x04\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t" +
    "\x17\x04\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A\x04\x1B\t\x1B\x04\x1C\t" +
    "\x1C\x04\x1D\t\x1D\x04\x1E\t\x1E\x03\x02\x03\x02\x03\x03\x03\x03\x03\x03" +
    "\x03\x03\x03\x03\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x03\x05" +
    "\x03\x05\x03\x05\x07\x05N\n\x05\f\x05\x0E\x05Q\v\x05\x03\x06\x03\x06\x03" +
    "\x07\x03\x07\x03\b\x03\b\x03\t\x03\t\x03\n\x06\n\\\n\n\r\n\x0E\n]\x03" +
    "\v\x05\va\n\v\x03\v\x03\v\x03\v\x03\v\x03\v\x05\vh\n\v\x03\f\x03\f\x03" +
    "\r\x03\r\x05\rn\n\r\x03\r\x03\r\x03\r\x05\rs\n\r\x03\r\x05\rv\n\r\x03" +
    "\x0E\x03\x0E\x03\x0F\x03\x0F\x03\x10\x03\x10\x03\x11\x03\x11\x03\x12\x03" +
    "\x12\x03\x13\x03\x13\x03\x14\x03\x14\x03\x14\x03\x15\x03\x15\x03\x16\x03" +
    "\x16\x03\x16\x03\x17\x03\x17\x03\x17\x03\x18\x03\x18\x03\x18\x03\x19\x03" +
    "\x19\x03\x19\x03\x1A\x03\x1A\x03\x1A\x03\x1B\x03\x1B\x03\x1C\x03\x1C\x03" +
    "\x1D\x03\x1D\x03\x1E\x06\x1E\x9F\n\x1E\r\x1E\x0E\x1E\xA0\x03\x1E\x03\x1E" +
    "\x02\x02\x02\x1F\x03\x02\x03\x05\x02\x04\x07\x02\x05\t\x02\x06\v\x02\x02" +
    "\r\x02\x02\x0F\x02\x02\x11\x02\x07\x13\x02\b\x15\x02\t\x17\x02\x02\x19" +
    "\x02\n\x1B\x02\v\x1D\x02\f\x1F\x02\r!\x02\x0E#\x02\x0F%\x02\x10\'\x02" +
    "\x11)\x02\x12+\x02\x13-\x02\x14/\x02\x151\x02\x163\x02\x175\x02\x187\x02" +
    "\x199\x02\x1A;\x02\x1B\x03\x02\x07\x05\x02C\\aac|\x03\x022;\x03\x023;" +
    "\x04\x02--//\x05\x02\v\f\x0E\x0F\"\"\xA8\x02\x03\x03\x02\x02\x02\x02\x05" +
    "\x03\x02\x02\x02\x02\x07\x03\x02\x02\x02\x02\t\x03\x02\x02\x02\x02\x11" +
    "\x03\x02\x02\x02\x02\x13\x03\x02\x02\x02\x02\x15\x03\x02\x02\x02\x02\x19" +
    "\x03\x02\x02\x02\x02\x1B\x03\x02\x02\x02\x02\x1D\x03\x02\x02\x02\x02\x1F" +
    "\x03\x02\x02\x02\x02!\x03\x02\x02\x02\x02#\x03\x02\x02\x02\x02%\x03\x02" +
    "\x02\x02\x02\'\x03\x02\x02\x02\x02)\x03\x02\x02\x02\x02+\x03\x02\x02\x02" +
    "\x02-\x03\x02\x02\x02\x02/\x03\x02\x02\x02\x021\x03\x02\x02\x02\x023\x03" +
    "\x02\x02\x02\x025\x03\x02\x02\x02\x027\x03\x02\x02\x02\x029\x03\x02\x02" +
    "\x02\x02;\x03\x02\x02\x02\x03=\x03\x02\x02\x02\x05?\x03\x02\x02\x02\x07" +
    "D\x03\x02\x02\x02\tJ\x03\x02\x02\x02\vR\x03\x02\x02\x02\rT\x03\x02\x02" +
    "\x02\x0FV\x03\x02\x02\x02\x11X\x03\x02\x02\x02\x13[\x03\x02\x02\x02\x15" +
    "g\x03\x02\x02\x02\x17i\x03\x02\x02\x02\x19u\x03\x02\x02\x02\x1Bw\x03\x02" +
    "\x02\x02\x1Dy\x03\x02\x02\x02\x1F{\x03\x02\x02\x02!}\x03\x02\x02\x02#" +
    "\x7F\x03\x02\x02\x02%\x81\x03\x02\x02\x02\'\x83\x03\x02\x02\x02)\x86\x03" +
    "\x02\x02\x02+\x88\x03\x02\x02\x02-\x8B\x03\x02\x02\x02/\x8E\x03\x02\x02" +
    "\x021\x91\x03\x02\x02\x023\x94\x03\x02\x02\x025\x97\x03\x02\x02\x027\x99" +
    "\x03\x02\x02\x029\x9B\x03\x02\x02\x02;\x9E\x03\x02\x02\x02=>\x072\x02" +
    "\x02>\x04\x03\x02\x02\x02?@\x07v\x02\x02@A\x07t\x02\x02AB\x07w\x02\x02" +
    "BC\x07g\x02\x02C\x06\x03\x02\x02\x02DE\x07h\x02\x02EF\x07c\x02\x02FG\x07" +
    "n\x02\x02GH\x07u\x02\x02HI\x07g\x02\x02I\b\x03\x02\x02\x02JO\x05\r\x07" +
    "\x02KN\x05\r\x07\x02LN\x05\x0F\b\x02MK\x03\x02\x02\x02ML\x03\x02\x02\x02" +
    "NQ\x03\x02\x02\x02OM\x03\x02\x02\x02OP\x03\x02\x02\x02P\n\x03\x02\x02" +
    "\x02QO\x03\x02\x02\x02RS\x05\r\x07\x02S\f\x03\x02\x02\x02TU\t\x02\x02" +
    "\x02U\x0E\x03\x02\x02\x02VW\t\x03\x02\x02W\x10\x03\x02\x02\x02XY\t\x04" +
    "\x02\x02Y\x12\x03\x02\x02\x02Z\\\x05\x0F\b\x02[Z\x03\x02\x02\x02\\]\x03" +
    "\x02\x02\x02][\x03\x02\x02\x02]^\x03\x02\x02\x02^\x14\x03\x02\x02\x02" +
    "_a\x05\x13\n\x02`_\x03\x02\x02\x02`a\x03\x02\x02\x02ab\x03\x02\x02\x02" +
    "bc\x070\x02\x02ch\x05\x13\n\x02de\x05\x13\n\x02ef\x070\x02\x02fh\x03\x02" +
    "\x02\x02g`\x03\x02\x02\x02gd\x03\x02\x02\x02h\x16\x03\x02\x02\x02ij\t" +
    "\x05\x02\x02j\x18\x03\x02\x02\x02km\x07g\x02\x02ln\x05\x17\f\x02ml\x03" +
    "\x02\x02\x02mn\x03\x02\x02\x02no\x03\x02\x02\x02ov\x05\x13\n\x02pr\x07" +
    "G\x02\x02qs\x05\x17\f\x02rq\x03\x02\x02\x02rs\x03\x02\x02\x02st\x03\x02" +
    "\x02\x02tv\x05\x13\n\x02uk\x03\x02\x02\x02up\x03\x02\x02\x02v\x1A\x03" +
    "\x02\x02\x02wx\x07-\x02\x02x\x1C\x03\x02\x02\x02yz\x07/\x02\x02z\x1E\x03" +
    "\x02\x02\x02{|\x07,\x02\x02| \x03\x02\x02\x02}~\x071\x02\x02~\"\x03\x02" +
    "\x02\x02\x7F\x80\x07#\x02\x02\x80$\x03\x02\x02\x02\x81\x82\x07@\x02\x02" +
    "\x82&\x03\x02\x02\x02\x83\x84\x07@\x02\x02\x84\x85\x07?\x02\x02\x85(\x03" +
    "\x02\x02\x02\x86\x87\x07>\x02\x02\x87*\x03\x02\x02\x02\x88\x89\x07>\x02" +
    "\x02\x89\x8A\x07?\x02\x02\x8A,\x03\x02\x02\x02\x8B\x8C\x07?\x02\x02\x8C" +
    "\x8D\x07?\x02\x02\x8D.\x03\x02\x02\x02\x8E\x8F\x07#\x02\x02\x8F\x90\x07" +
    "?\x02\x02\x900\x03\x02\x02\x02\x91\x92\x07(\x02\x02\x92\x93\x07(\x02\x02" +
    "\x932\x03\x02\x02\x02\x94\x95\x07~\x02\x02\x95\x96\x07~\x02\x02\x964\x03" +
    "\x02\x02\x02\x97\x98\x070\x02\x02\x986\x03\x02\x02\x02\x99\x9A\x07*\x02" +
    "\x02\x9A8\x03\x02\x02\x02\x9B\x9C\x07+\x02\x02\x9C:\x03\x02\x02\x02\x9D" +
    "\x9F\t\x06\x02\x02\x9E\x9D\x03\x02\x02\x02\x9F\xA0\x03\x02\x02\x02\xA0" +
    "\x9E\x03\x02\x02\x02\xA0\xA1\x03\x02\x02\x02\xA1\xA2\x03\x02\x02\x02\xA2" +
    "\xA3\b\x1E\x02\x02\xA3<\x03\x02\x02\x02\f\x02MO]`gmru\xA0\x03\b\x02\x02";
