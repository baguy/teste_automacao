var expect = require('chai').expect;
var sinon = require('sinon');

var moduleLoader = require('./common/moduleLoader.js');
var mockFactory = require('./common/mockFactory.js');
var json = require('./common/jsonComparer.js');

var js = '../../../apiproxy/resources/jsc/validateVariables.js';

describe('feature: Test validateVariables', function () {

    it('detect v_userAgent header', function (done) {

        var mock = mockFactory.getMock();
        
        var names = {
            toArray: function () {
                return ['userAgent']
            }
        };
        mock.contextGetVariableMethod.withArgs('request.headers.names').returns(names);
        mock.contextGetVariableMethod.withArgs('request.headers.count').returns(1);
        mock.contextGetVariableMethod.withArgs('request.header.userAgent').returns('symbian');

        moduleLoader.load(js, function (err) {

            expect(err).to.be.undefined;

            var expectedError = JSON.stringify(
                {"code":"400.02.05","message":"Invalid variables in request","errors":["Header Variable, userAgent, is not Android or IOS"]}
                );
            
            expect(mock.contextSetVariableMethod.calledWith('variable.validation.errors', expectedError)).to.be.true;
            done();
        });
    });
});