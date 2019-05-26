var should = require('should'),
  sinon = require('sinon'),
  proxyquire = require('proxyquire').noCallThru();

require('should-sinon');

describe('Firebase', function() {
  var firebaseMock,
    appMock,
    databaseMock,
    childMock,
    rootRefMock,
    refMock,
    Storage;

  beforeEach(function() {
    childMock = {
      doc: sinon.stub().returns(childMock),
      then: sinon.stub(),
      set: sinon.stub().returns(childMock),
      get: sinon.stub().returns(childMock)
    };

    refMock = {
      update: sinon.stub(),
      then: sinon.stub(),
      get: sinon.stub().returns(childMock),
      set: sinon.stub().returns(childMock),
      doc: sinon.stub().returns(childMock)
    };

    rootRefMock = {
      doc: sinon.stub().returns(refMock)
    };

    databaseMock = {
      settings: sinon.stub(),
      collection: sinon.stub().returns(refMock)
    };

    appMock = {
      firestore: sinon.stub().returns(databaseMock)
    };

    firebaseMock = {
      initializeApp: sinon.stub().returns(appMock)
    };

    Storage = proxyquire('../src/index', {
      firebase: firebaseMock
    });
  });

  describe('init', function() {
    it('should require a config', function() {
      Storage.should.throw('configuration is required.');
    });

    it('should require databaseURL', function() {
      (function() {
        Storage({});
      }.should.throw('databaseURL or database is required.'));
    });

    it('should initialize with database', function() {
      Storage({ database: databaseMock });
      firebaseMock.initializeApp.should.not.be.calledWith({
        database: databaseMock
      });
    });
    it('should initialize firebase with databaseURL', function() {
      Storage({ databaseURL: 'crystalbluepersuation' });
      firebaseMock.initializeApp.should.be.calledWith({
        databaseURL: 'crystalbluepersuation',
        settings: { timestampsInSnapshots: true }
      });
    });
  });

  ['teams', 'channels', 'users'].forEach(function(method) {
    describe('get', function() {
      var records, record, config;

      beforeEach(function() {
        config = { databaseURL: 'right_here' };

        record = {};
        records = {
          data: sinon.stub().returns(record)
        };
      });

      it('should get records', function() {
        var cb = sinon.stub();
        childMock.get.returns({
          then: function(callback) {
            return callback(records);
          }
        });

        Storage(config)[method].get('walterwhite', cb);
        //childMock.get.firstCall.args[0].should.equal('value');
        records.data.should.be.called;
        cb.should.be.calledWith(null, record);
      });

      it('should call callback on error', function() {
        var cb = sinon.stub(),
          err = new Error('OOPS');

        childMock.get.returns({
          then: function(success, error) {
            return error(err);
          }
        });

        Storage(config)[method].get('walterwhite', cb);
        //childMock.get.firstCall.args[0].should.equal('value');
        records.data.should.not.be.called;
        cb.should.be.calledWith(err);
      });
    });

    describe('save', function() {
      var config;

      beforeEach(function() {
        config = { databaseURL: 'right_here' };
      });

      it('should call firebase update', function() {
        var cb = sinon.stub(),
          data = { id: 'walterwhite' },
          updateObj = { walterwhite: data };

        childMock.set.returns({
          then: function(callback) {
            return callback();
          }
        });

        Storage(config)[method].save(data, cb);
        childMock.set.should.be.calledWith(data, { merge: true });
        //refMock.set.should.be.calledWith(data, {merge: true});
        cb.should.be.calledOnce();
      });
    });

    describe('all', function() {
      var records, record, config;

      beforeEach(function() {
        config = { databaseURL: 'right_here' };

        record = {
          walterwhite: { id: 'walterwhite', name: 'heisenberg' },
          jessepinkman: { id: 'jessepinkman', name: 'capncook' }
        };

        records = {
          docs: [
            {
              data: function() {
                return { id: 'walterwhite', name: 'heisenberg' };
              }
            },
            {
              data: function() {
                return { id: 'jessepinkman', name: 'capncook' };
              }
            }
          ]
        };
        records.empty = false;
      });

      it('should get records', function() {
        var cb = sinon.stub(),
          result = [
            { id: 'walterwhite', name: 'heisenberg' },
            { id: 'jessepinkman', name: 'capncook' }
          ];

        refMock.get.returns({
          then: function(callback) {
            return callback(records);
          }
        });
        Storage(config)[method].all(cb);
        //refMock.once.firstCall.args[0].should.equal('value');
        // records.data.should.be.called;
        // console.log('cb call', cb.firstCall);
        cb.should.be.calledWith(null, result);
      });

      it('should handle no records', function() {
        var cb = sinon.stub();

        records.empty = true;
        refMock.get.returns({
          then: function(callback) {
            return callback(records);
          }
        });

        Storage(config)[method].all(cb);
        //refMock.once.firstCall.args[0].should.equal('value');
        //records.data.should.be.called;
        cb.should.be.calledWith(null, []);
      });

      // it('should call callback on error', function() {
      //     var cb = sinon.stub(),
      //         err = new Error('OOPS');

      //     refMock.get.returns({
      //         then: function(success, error) {
      //             return error(err);
      //         }
      //     });

      //     Storage(config)[method].all(cb);
      //     // refMock.once.firstCall.args[0].should.equal('value');
      //     // records.data.should.not.be.called;
      //     cb.should.be.calledWith(err);
      // });
    });
  });
});
