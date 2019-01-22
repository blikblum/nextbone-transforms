const getPath = require('lodash/get')
const each = require('lodash/each')

const knownDecorators = ['validation', 'computed']
const knownClasses = ['Model', 'Collection']

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;

  const root = j(file.source)

  let bbIdentifier = 'Backbone'
  const classIdentifiers = []
  const addImports = {}

  function buildClass(className, callExpression, baseClassNameAST, isExpression) {    
    const decorators = []
    if (callExpression.arguments.length) {
      const options = callExpression.arguments[0]
      options.properties.forEach(property => {
        const propName = property.key.name
        if (property.value && property.value.type === 'ObjectExpression') {
          if (knownDecorators.indexOf(propName) !== -1) {
            decorators.push(j.decorator(j.callExpression(j.identifier(propName), [property.value])))
            if (!addImports[propName]) {
              addImports[propName] = j.importDeclaration([j.importSpecifier(j.identifier(propName))], j.stringLiteral(`nextbone/${propName}`), 'value')
            }            
          }
        }
      })
    }
    let nameIdentifier
    let classType
    if (isExpression) {
      nameIdentifier = null
      classType = 'classExpression'
    } else {
      nameIdentifier = j.identifier(className)
      classType = 'classDeclaration'
    }
    const result = j[classType](nameIdentifier, j.classBody([]), baseClassNameAST)
    result.decorators = decorators
    return result
  }

  function parseCallExpression(path, baseClassNameAST) {
    let parent = path.parentPath
    switch (parent.value.type) {
      case 'VariableDeclarator': 
        const className = parent.value.id.name;
        parent = parent.parentPath.parentPath
        if (parent.value.type === 'VariableDeclaration') {
          j(parent).replaceWith(buildClass(className, path.value, baseClassNameAST))
        }
        break;
      case 'AssignmentExpression':
      case 'ExportDefaultDeclaration':
        j(path).replaceWith(buildClass(null, path.value, baseClassNameAST, true))
        break;
    }
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
        } else {
          if (knownClasses.indexOf(specifier.imported.name) !== -1) {
            classIdentifiers.push(specifier.local.name)
          }
        }
      })        
      j(path)
        .find(j.StringLiteral, { value: 'backbone' })
        .replaceWith(j.stringLiteral('nextbone')) 
    })


  // search scoped backbone classes
  root
    .find(j.CallExpression, {
      callee: { object: { object: { type: 'Identifier', name: bbIdentifier } }, property: { name: 'extend' }  }
    })
    .forEach(path => {
      const baseClassName = getPath(path.value, 'callee.object.property.name')
      const baseClassNameAST = j.memberExpression(j.identifier(bbIdentifier), j.identifier(baseClassName))
      parseCallExpression(path, baseClassNameAST)
    })

  classIdentifiers.forEach(baseClassName => {
    root
    .find(j.CallExpression, {
      callee: { object: { type: 'Identifier', name: baseClassName }, property: { name: 'extend' }  }
    })
    .forEach(path => {
      const baseClassNameAST = j.identifier(baseClassName)
      parseCallExpression(path, baseClassNameAST)
    })
  })  
  
  // add imports
  if (Object.keys(addImports).length) {    
    root
      .find(j.Program)
      .forEach(path => {
        let importAddIndex = 0
        path.value.body.forEach((item, index) => {
          if (item.type === 'ImportDeclaration') {
            importAddIndex = index + 1
          }
        })
        each(addImports, (value) => {
          path.value.body.splice(importAddIndex, 0, value)
          importAddIndex++
        })
      })
  }

  return root.toSource();
}

module.exports.parser = 'babylon'