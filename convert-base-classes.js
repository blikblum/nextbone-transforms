const getPath = require('lodash/get')

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;

  const ast = j(file.source)
  
  // search backbone imports
  ast
    .find(j.CallExpression, {
      callee: { name: 'require',  type: 'Identifier' },
      arguments: [{ type: 'Literal', value: 'backbone' }]
    })
    .forEach(path => {
      j(path)
        .find(j.Literal, { value: 'backbone' })
        .replaceWith(j.literal('nextbone')) 
    })

  // search backbone classes
  ast
    .find(j.CallExpression, {
      callee: { object: { object: { type: 'Identifier', name: 'Backbone' } }, property: { name: 'extend' }  }
    })
    .forEach(path => {
      let parent = path.parentPath
      if (parent.value.type === 'VariableDeclarator') {
        const className = parent.value.id.name;
        parent = parent.parentPath.parentPath
        if (parent.value.type === 'VariableDeclaration') {
          const backboneClassName = getPath(path.value, 'callee.object.property.name')
          const backboneClassNameAST = j.memberExpression(j.identifier('Backbone'), j.identifier(backboneClassName))
          const classAST = j.classDeclaration(j.identifier(className), j.classBody([]), backboneClassNameAST)
          j(parent).replaceWith(classAST)
        }
      }
    })

  return ast.toSource();
}