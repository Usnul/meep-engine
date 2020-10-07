@builtin "whitespace.ne"
@builtin "number.ne"

expression                      -> binary_expression_add {% id %}

group_expression                -> "(" _ expression _ ")" {% (a) => a[2] %}
								| atomic {% id %}

#####################
# Unary Expressions
#####################

unary_expression_negate         -> "-" _ expression {% (d)=> {return {type:'UnaryNegate', value: d[2]}} %}
                                | group_expression {% id %}


unary_expression_not            -> "!" _ expression {% (d)=> {return {type:'UnaryNot', value: d[2]}} %}
                                | unary_expression_negate {% id %}

#####################
# Binary Expressions
#####################

# Logic

binary_expression_or            -> binary_expression_or _ "||" _ unary_expression_not {% (d)=> {return {type:'BinaryOr', left: d[0], right: d[4]}} %}
                                |  unary_expression_not {% id %}

binary_expression_and           -> binary_expression_and _ "&&" _ binary_expression_or {% (d)=> {return {type:'BinaryAnd', left: d[0], right: d[4]}} %}
                                |  binary_expression_or {% id %}

# Equality

binary_expression_equals        -> binary_expression_equals _ "==" _ binary_expression_and {% (d)=> {return {type:'BinaryEqual', left: d[0], right: d[4]}} %}
                                |  binary_expression_and {% id %}

binary_expression_not_equals    -> binary_expression_not_equals _ "!=" _ binary_expression_equals {% (d)=> {return {type:'BinaryNotEqual', left: d[0], right: d[4]}} %}
                                |  binary_expression_equals {% id %}

# Comparison

binary_expression_lte           -> binary_expression_lte _ "<=" _ binary_expression_not_equals {% (d)=> {return {type:'BinaryLessOrEqual', left: d[0], right: d[4]}} %}
                                |  binary_expression_not_equals {% id %}

binary_expression_gte           -> binary_expression_gte _ ">=" _ binary_expression_lte {% (d)=> {return {type:'BinaryGreaterOrEqual', left: d[0], right: d[4]}} %}
                                |  binary_expression_lte {% id %}

binary_expression_lt            -> binary_expression_lt _ "<" _ binary_expression_gte {% (d)=> {return {type:'BinaryLess', left: d[0], right: d[4]}} %}
                                |  binary_expression_gte {% id %}

binary_expression_gt            -> binary_expression_gt _ ">" _ binary_expression_lt {% (d)=> {return {type:'BinaryGreater', left: d[0], right: d[4]}} %}
                                |  binary_expression_lt {% id %}

# Multiplication

binary_expression_multiply      -> binary_expression_multiply _ "*" _ binary_expression_gt {% (d)=> {return {type:'BinaryMultiply', left: d[0], right: d[4]}} %}
                                |  binary_expression_gt {% id %}

binary_expression_divide        -> binary_expression_divide _ "/" _ binary_expression_multiply {% (d)=> {return {type:'BinaryDivide', left: d[0], right: d[4]}} %}
                                |  binary_expression_multiply {% id %}

# Addition

binary_expression_subtract      -> binary_expression_subtract _ "-" _ binary_expression_divide {% (d)=> {return {type:'BinarySubtract', left: d[0], right: d[4]}} %}
                                |  binary_expression_divide {% id %}

binary_expression_add           -> binary_expression_add _ "+" _ binary_expression_subtract {% (d)=> {return {type:'BinaryAdd', left: d[0], right: d[4]}} %}
                                |  binary_expression_subtract {% id %}


#####################
# Primitives
#####################

atomic                          -> literal {% id %}
								| reference {% (d,l,r)=> { return {type:'Reference', value: d[0] } }  %}

reference                       -> identifier ("." identifier {% (a)=>a[1] %}):* {% (a,l,r) => [a[0]].concat(a[1]) %}

identifier                      -> [a-zA-Z_] [a-zA-Z_0-9]:* {% (d,l,r) => { const value =d[0]+d[1].join(""); if(value === 'true' || value === 'false'){return r}else{return value} }  %}

literal                         -> decimal  {% (d)=> {return {type:'LiteralNumber', value: d[0] }} %}
                                |  literal_boolean {% (d) => { return {type:'LiteralBoolean', value:d[0]} } %}


literal_boolean                 -> "true"  {% ()=> true %}
                                |  "false" {% ()=> false %}
