'use strict';
const fs = require('fs-extra');
const shasum = require('shasum');
const download = require('download');
const decompress = require('decompress');

const errors = require('../errors');
const yarn = require('../utils/yarn');

const subTasks = {
    dist: (ctx) => {
        return yarn(['info', `ghost@${ctx.version}`, 'dist', '--json']).then((result) => {
            let dist;

            try {
                let parsed = JSON.parse(result.stdout);
                dist = parsed && parsed.data;
            } catch (e) {}

            if (!dist) {
                return Promise.reject(new errors.CliError('Ghost download information could not be read correctly.'));
            }

            ctx.shasum = dist.shasum;
            ctx.tarball = dist.tarball;
        });
    },
    download: (ctx) => {
        return download(ctx.tarball).then((data) => {
            if (shasum(data) !== ctx.shasum) {
                // shasums don't match - this is not good
                return Promise.reject(new errors.CliError('Ghost download integrity compromised.' +
                    'Cancelling install because of potential security issues'));
            }

            fs.ensureDirSync(ctx.installPath);
            return decompress(data, ctx.installPath, {
                map: (file) => {
                    file.path = file.path.replace('package/', '');
                    return file;
                }
            });
        });
    }
};

module.exports = function yarnInstall(ui, zipFile) {
    const tasks = zipFile ? [{
        title: 'Extracting release from local zip',
        task: (ctx) => decompress(zipFile, ctx.installPath)
    }] : [{
        title: 'Getting download information',
        task: subTasks.dist
    }, {
        title: 'Downloading',
        task: subTasks.download
    }];

    tasks.push({
        title: 'Installing dependencies',
        task: (ctx) => yarn(['install', '--no-emoji', '--no-progress'], {
            cwd: ctx.installPath,
            env: {NODE_ENV: 'production'},
            observe: true
        })
    });

    return ui.listr(tasks, false);
};
module.exports.subTasks = subTasks;
