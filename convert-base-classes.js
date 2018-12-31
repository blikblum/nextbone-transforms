const getPath = require('lodash/get')

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;

  const root = j(file.source)

  let backboneIdentifier = 'Backbone'
  
  // search backbone imports
  root
    .find(j.CallExpression, {
      callee: { name: 'require',  type: 'Identifier' },
      arguments: [{ type: 'StringLiteral', value: 'backbone' }]
    })
    .forEach(path => {
      if (path.parentPath.value.type === 'VariableDeclarator') {
        backboneIdentifier = path.parentPath.value.id.name
      }
      j(path)
        .find(j.StringLiteral, { value: 'backbone' })
        .replaceWith(j.stringLiteral('nextbone')) 
    })

  // search backbone classes
  root
    .find(j.CallExpression, {
      callee: { object: { object: { type: 'Identifier', name: backboneIdentifier } }, property: { name: 'extend' }  }
    })
    .forEach(path => {
      let parent = path.parentPath
      if (parent.value.type === 'VariableDeclarator') {
        const className = parent.value.id.name;
        parent = parent.parentPath.parentPath
        if (parent.value.type === 'VariableDeclaration') {
          const backboneClassName = getPath(path.value, 'callee.object.property.name')
          const backboneClassNameAST = j.memberExpression(j.identifier(backboneIdentifier), j.identifier(backboneClassName))
          const classAST = j.classDeclaration(j.identifier(className), j.classBody([]), backboneClassNameAST)
          j(parent).replaceWith(classAST)
        }
      }
    })

  return root.toSource();
}

module.exports.parser = 'babylon'