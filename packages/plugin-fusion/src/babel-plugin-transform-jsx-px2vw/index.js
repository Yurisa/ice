const { SHOULD_REMOVE_PX_PROPERTY_JSX } = require('./constants');

const helperImportedFrom = 'babel-runtime-jsx-style-transform';
const helperImportedName = 'px2vw';
const helperLocalName = '__px2vw__';

module.exports = function (babel) {
  const { types: t } = babel;

  return {
    visitor: {
      JSXElement(path) {
        const { node } = path;
        const oe = node.openingElement;
        const ce = node.closingElement;

        // style中单位处理
        const attrs = oe.attributes;
          attrs.forEach((attr) => {
            if (t.isJSXAttribute(attr)) {
              if (t.isJSXIdentifier(attr.name) && attr.name.name === 'style') {
                const ep = attr.value.expression;
                if (t.isObjectExpression(ep)) {
                  const properties = ep.properties || {};
                  properties.forEach((pt) => {
                    if (t.isObjectProperty(pt)) {
                      if (pt.key && t.isIdentifier(pt.key) && SHOULD_REMOVE_PX_PROPERTY_JSX.indexOf(pt.key.name) > -1) {
                        const rootPath = path.findParent(p => p.isProgram());
                        const imported = t.identifier(helperImportedName);
                        const local = t.identifier(helperLocalName);
                        const importDeclaration = t.importDeclaration([
                          t.importSpecifier(local, imported)
                        ], t.stringLiteral(helperImportedFrom));
                        rootPath.unshiftContainer('body', importDeclaration);
                        console.log('pt.value', pt.value);


                        // 如果是变量调用包中的方法，如果是直接数值或带px单位的字符，在此处转换
                        if (t.isIdentifier(pt.value)) {
                          pt.value = t.callExpression(t.identifier(helperLocalName), [pt.value]);
                        } else if (t.isStringLiteral(pt.value)) {
                          if (pt.value.value && pt.value.value.includes('px')) {
                            pt.value = t.callExpression(t.identifier(helperLocalName), [pt.value]);
                          }
                        } else if (t.isNumericLiteral(pt.value)) { // 如果是数字
                          console.log('pt.value', pt.value);
                          pt.value = t.callExpression(t.identifier(helperLocalName), [t.stringLiteral(`${pt.value.value}px`)]);
                        } else if (t.isTemplateLiteral(pt.value)) { // 如果是`${}·类型
                          const { quasis } = pt.value;
                          if (quasis.find((item) => item.value && item.value.raw === 'px')) {
                            pt.value = t.callExpression(t.identifier(helperLocalName), [pt.value]);
                          }
                        }
                      }
                    }
                  });
                }
              }
            }
          });
      },
    },
  };
};
