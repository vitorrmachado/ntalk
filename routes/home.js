module.exports = (app) => {
    const {home} = app.controllers;
    app.get('/', home.index);
    app.post('/login', home.login);
    app.get('/logout', home.logout);
};