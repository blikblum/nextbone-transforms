const getPath = require('lodash/get')
const each = require('lodash/each')

const knownDecorators = ['validation', 'computed']

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;

  const root = j(file.source)

  let bbIdentifier = 'Backbone'
  const addImports = {}

  function buildClass(className, callExpression) {
    const bbClassName = getPath(callExpression, 'callee.object.property.name')
    const bbClassNameAST = j.memberExpression(j.identifier(bbIdentifier), j.identifier(bbClassName))
    const decorators = []
    if (callExpression.arguments.length) {
      const options = callExpression.arguments[0]
      options.properties.forEach(property => {
        const propName = property.key.name
        if (property.value.type === 'ObjectExpression') {
          if (knownDecorators.indexOf(propName) !== -1) {
            decorators.push(j.decorator(j.callExpression(j.identifier(propName), [property.value])))
            if (!addImports[propName]) {
              addImports[propName] = j.importDeclaration([j.importSpecifier(j.identifier(propName))], j.stringLiteral(`nextbone/${propName}`), 'value')
            }            
          }
        }
      })
    }
    const result = j.classDeclaration(j.identifier(className), j.classBody([]), bbClassNameAST)
    result.decorators = decorators
    return result
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
  
  // add imports
  if (Object.keys(addImports).length) {
    const importDeclarations = root.find(j.ImportDeclaration)
    if (importDeclarations.length) {
      const lastImport = importDeclarations.paths(importDeclarations.length - 1)
      each(addImports, importAST => {
        j(lastImport).insertAfter(importAST)
      })
    } else {
      root
        .find(j.Program)
        .forEach(path => {
          each(addImports, importAST => {
            path.value.body.splice(0, 0, importAST)
          })
        })         
    }
  }

  return root.toSource();
}

module.exports.parser = 'babylon'