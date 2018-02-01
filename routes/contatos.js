const autenticar = require('../middlewares/autenticador')

module.exports = (app) => {
    const { contatos } = app.controllers;
    app.get('/contatos', autenticar, contatos.index);
    app.get('/contatos', autenticar, contatos.index);
    app.get('/contato/:id', autenticar, contatos.show);
    app.get('/contato/:id/editar', autenticar, contatos.edit);
    app.put('/contato/:id', autenticar, contatos.update);
    app.post('/contato', autenticar, contatos.create);
    app.delete('/contato/:id', autenticar, contatos.destroy);
};