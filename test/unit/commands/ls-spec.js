'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const stripAnsi = require('strip-ansi');

const LsCommand = require('../../../lib/commands/ls');

describe('Unit: Commands > ls', function () {
    it('outputs the correct data for instances that are running and not running', function () {
        const summaryStub = sinon.stub();
        summaryStub.onFirstCall().returns({
            name: 'testa',
            dir: '/var/www/testa',
            version: '1.5.0',
            running: false
        });
        summaryStub.onSecondCall().returns({
            name: 'testb',
            dir: '/var/www/testb',
            version: '1.2.0',
            running: true,
            mode: 'production',
            url: 'https://testa.com',
            port: 2369,
            process: 'systemd'
        });
        summaryStub.onThirdCall().returns({
            name: 'testc',
            dir: '/var/www/testc',
            version: '1.3.0',
            running: true,
            mode: 'development',
            url: 'http://localhost:2370',
            port: 2370,
            process: 'local'
        });
        const getAllInstancesStub = sinon.stub().returns([
            {summary: summaryStub},
            {summary: summaryStub},
            {summary: summaryStub}
        ]);
        const tableStub = sinon.stub();

        const instance = new LsCommand({table: tableStub}, {getAllInstances: getAllInstancesStub});

        instance.run();
        expect(summaryStub.calledThrice).to.be.true;
        expect(tableStub.calledOnce).to.be.true;
        expect(tableStub.args[0][0]).to.deep
            .equal(['Name', 'Location', 'Version', 'Status', 'URL', 'Port', 'Process Manager']);
        const rows = tableStub.args[0][1];
        expect(rows).to.be.an.instanceof(Array);
        expect(rows).to.have.length(3);

        const expected = [
            ['testa', '/var/www/testa', '1.5.0', 'stopped', 'n/a', 'n/a', 'n/a'],
            ['testb', '/var/www/testb', '1.2.0', 'running (production)', 'https://testa.com', 2369, 'systemd'],
            ['testc', '/var/www/testc', '1.3.0', 'running (development)', 'http://localhost:2370', 2370, 'local']
        ];

        expected.forEach((row, i) => {
            row.forEach((prop, j) => {
                expect(stripAnsi(rows[i][j])).to.equal(prop);
            });
        });
    });
});
