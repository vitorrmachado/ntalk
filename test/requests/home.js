const app = require('../../app');
const should = require('should');
const request = require('supertest')(app);
  describe('No controller home', () => {
    it('GET "/" retorna status 200', (done) => {
        request.get('/').end((err, res) => {
            res.status.should.eql(200);
            done();
        });
    });
    /*it('GET "/sair" redireciona para GET "/"', (done) => {
        request.get('/sair').end((err, res) => {
            console.log(res);
            res.headers.location.should.eql('/');
            done();
        });
    });*/
    it('POST "/login" válido redireciona para GET "/contatos"', (done) => {
        const usuario = { nome: 'Teste', email: 'teste@teste' };
        request.post('/login')
               .send({ usuario })
               .end((err, res) => {
                    console.log();
                    res.headers.location.should.eql('/contatos');
                    done();
                });
    });
    it('POST "/login" inválido redireciona para GET "/"', (done) => {
        const usuario = { nome: '', email: '' };
        request.post('/login')
               .send({ usuario })
               .end((err, res) => {
                    res.headers.location.should.eql('/');
                    done();
                });
    });
  });