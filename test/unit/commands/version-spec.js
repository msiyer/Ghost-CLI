'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const stripAnsi = require('strip-ansi');

const modulePath = '../../../lib/commands/version';

describe('Unit: Commands > Version', function () {
    it('only outputs ghost-cli version if not run in a ghost folder', function () {
        const VersionCommand = require(modulePath);
        const hasStub = sinon.stub().returns(false);
        const logStub = sinon.stub();
        const getInstanceStub = sinon.stub().returns({cliConfig: {has: hasStub}});
        const cliVersion = '1.0.0';
        const instance = new VersionCommand({log: logStub}, {getInstance: getInstanceStub, cliVersion: cliVersion});

        instance.run();
        expect(logStub.calledOnce).to.be.true;
        expect(stripAnsi(logStub.args[0][0])).to.match(/Ghost-CLI version\: 1\.0\.0/);
        expect(getInstanceStub.calledOnce).to.be.true;
        expect(hasStub.calledOnce).to.be.true;
    });

    it('outputs both ghost-cli and ghost version if run in a ghost install folder', function () {
        const homedirStub = sinon.stub().returns('/var/www');
        const hasStub = sinon.stub().returns(true);
        const getStub = sinon.stub().returns('1.5.0');
        const logStub = sinon.stub();
        const getInstanceStub = sinon.stub().returns({cliConfig: {has: hasStub, get: getStub}, dir: '/var/www/ghost'});
        const cliVersion = '1.0.0';
        const VersionCommand = proxyquire(modulePath, {
            os: {homedir: homedirStub}
        });
        const instance = new VersionCommand({log: logStub}, {getInstance: getInstanceStub, cliVersion: cliVersion});

        instance.run();
        expect(logStub.calledTwice).to.be.true;
        expect(stripAnsi(logStub.args[0][0])).to.match(/Ghost-CLI version\: 1\.0\.0/);
        expect(stripAnsi(logStub.args[1][0])).to.match(/Ghost Version \(at \~\/ghost\)\: 1\.5\.0/);
        expect(getInstanceStub.calledOnce).to.be.true;
        expect(hasStub.calledOnce).to.be.true;
        expect(getStub.calledOnce).to.be.true;
    });
});
