const getPath = require('lodash/get')

const knownDecorators = ['validation']

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;

  const root = j(file.source)

  let bbIdentifier = 'Backbone'

  function buildClass(className, callExpression) {
    const bbClassName = getPath(callExpression, 'callee.object.property.name')
    const bbClassNameAST = j.memberExpression(j.identifier(bbIdentifier), j.identifier(bbClassName))
    return j.classDeclaration(j.identifier(className), j.classBody([]), bbClassNameAST)
  }  
  
  // search backbone cjs/require import
  root
    .find(j.CallExpression, {
      callee: { name: 'require',  type: 'Identifier' },
      arguments: [{ type: 'StringLiteral', value: 'backbone' }]
    })
    .forEach(path => {
      if (path.parentPath.value.type === 'VariableDeclarator') {
        bbIdentifier = path.parentPath.value.id.name
      }
      j(path)
        .find(j.StringLiteral, { value: 'backbone' })
        .replaceWith(j.stringLiteral('nextbone')) 
    })
  
  // search backbone es import
  root
    .find(j.ImportDeclaration, {    
      source: { value: 'backbone' }
    })
    .forEach(path => {
      path.value.specifiers.forEach(specifier => {
        if (specifier.type === 'ImportDefaultSpecifier') {
          bbIdentifier = specifier.local.name
        }      
      })        
      j(path)
        .find(j.StringLiteral, { value: 'backbone' })
        .replaceWith(j.stringLiteral('nextbone')) 
    })


  // search backbone classes
  root
    .find(j.CallExpression, {
      callee: { object: { object: { type: 'Identifier', name: bbIdentifier } }, property: { name: 'extend' }  }
    })
    .forEach(path => {
      let parent = path.parentPath
      if (parent.value.type === 'VariableDeclarator') {
        const className = parent.value.id.name;
        parent = parent.parentPath.parentPath
        if (parent.value.type === 'VariableDeclaration') {
          j(parent).replaceWith(buildClass(className, path.value))
        }
      }
    })

  return root.toSource();
}

module.exports.parser = 'babylon'