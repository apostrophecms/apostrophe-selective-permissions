const assert = require('assert');
const request = require('request-promise');
const _ = require('lodash');

describe('test apostrophe-nuanced-permissions', function() {

  let apos;

  this.timeout(20000);

  after(function(done) {
    require('apostrophe/test-lib/util').destroy(apos, done);
  });

  it('initializes', function(done) {
    apos = require('apostrophe')({
      testModule: true,
      shortName: 'apostrophe-nuanced-permissions-test',      
      modules: {
        'skeleton': {
          construct: function(self, options) {
            // For testing, a simple way to simulate normal login as
            // an admin user with full permissions
            self.expressMiddleware = function(req, res, next) {
              if (req.query.skeleton === 'admin') {
                req.user = {
                  _id: 'fakeadmin',
                  username: 'admin',
                  title: 'admin',
                  _permissions: {
                    'admin': true
                  }
                };
              } else if (req.query.skeleton === 'seo') {
                req.user = {
                  _id: 'fakeseo',
                  username: 'seo',
                  title: 'seo',
                  _permissions: {
                    'seo': true
                  }
                };
              } else if (req.query.skeleton === 'rando') {
                req.user = {
                  _id: 'fakerando',
                  username: 'rando',
                  title: 'rando',
                  _permissions: {}
                };
              }
              next();
            };
          }
        },
        'apostrophe-express': {
          secret: 'xxx',
          port: 7900,
          csrf: false
        },
        'apostrophe-nuanced-permissions': {
          permissions: [
            {
              name: 'seo',
              label: 'SEO'
            }
          ]
        },
        'products': {
          extend: 'apostrophe-pieces',
          name: 'product',
          addFields: [
            {
              name: 'color',
              type: 'select',
              choices: [
                {
                  label: 'Red',
                  value: 'red'
                },
                {
                  label: 'Blue',
                  value: 'blue'
                }
              ]
            }
          ],
          nuancedPermissions: {
            seo: {
              update: {
                fields: [ 'title', 'tags' ]
              }
            }
          }
        },
      },
      afterInit: function(callback) {
        assert(apos.modules['products']);
        assert(apos.modules['products'].options.nuancedPermissions);
        return callback(null);
      },
      afterListen: function(err) {
        assert(!err);
        done();
      }
    });
  });
  
  it('can insert test products', async function() {
    await apos.tasks.invoke('products:generate', { total: 10 });
  });

  it('cannot access list route anonymously', async function() {
    const response = await request('http://localhost:7900/modules/products/list', {
      method: 'POST',
      body: {
        format: 'allIds'
      },
      json: true
    });
    assert(!response.data.ids.length);
  });

  it('can access list route with admin credentials', async function() {
    const response = await request('http://localhost:7900/modules/products/list?skeleton=admin', { 
      method: 'POST',
      body: {
        format: 'allIds'
      },
      json: true
    });

    assert(response.data.ids.length);
  });

  let ids;

  it('can access list route with seo permission', async function() {
    const response = await request('http://localhost:7900/modules/products/list?skeleton=seo', { 
      method: 'POST',
      body: {
        format: 'allIds'
      },
      json: true
    });
    assert(response.data.ids.length);
    ids = response.data.ids;
  });

  it('can fetch editor modal with seo permission, receive only appropriate fields', async function() {
    const response = await request('http://localhost:7900/modules/products/editor-modal?skeleton=seo', { 
      method: 'POST',
      body: {
        id: ids[0]
      },
      json: true
    });
    assert(response.indexOf('data-name="tags"') !== -1);
    assert(response.indexOf('data-name="title"') !== -1);
    assert(response.indexOf('data-name="color"') === -1);
  });

  it('can fetch editor modal with admin permission, receive all fields', async function() {
    const response = await request('http://localhost:7900/modules/products/editor-modal?skeleton=admin', { 
      method: 'POST',
      body: {
        id: ids[0]
      },
      json: true
    });
    assert(response.indexOf('data-name="tags"') !== -1);
    assert(response.indexOf('data-name="title"') !== -1);
    assert(response.indexOf('data-name="color"') !== -1);
  });

  it('cannot fetch editor modal as a random user', async function() {
    const response = await request('http://localhost:7900/modules/products/editor-modal?skeleton=rando', { 
      method: 'POST',
      body: {
        id: ids[0]
      },
      json: true
    });
    assert(response.status === 'forbidden');
  });

});
