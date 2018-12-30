module.exports = function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.VariableDeclaration)
    .filter(path => {      
      return path.value.declarations.some(declaration => {
        const init = declaration.init
        return init.type === 'CallExpression' && init.callee.object.object.name === 'Backbone' && init.callee.object.property.name === 'Model'
         
      })
    }) 
    .forEach(path => {
      path.dummy = 'xx'
      path.value.declarations.forEach(declaration => {
        const validation = declaration.init.arguments[0].properties.find(prop => prop.key.name === 'validation')
        console.log(validation)
      })      
    })
    .replaceWith(path => {
      console.log(path.dummy)
      const className = path.value.declarations[0].id.name;
      return j.classDeclaration(j.identifier(className), j.classBody([]), j.identifier('Model'))
    })
    .toSource();
}