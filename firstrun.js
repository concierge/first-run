/**
 * Provides methods for performing a first-run module install.
 *
 * When there are no modules installed, this code will download a known set of
 * defaults using known install list locations.
 *
 * Written By:
 *              Matthew Knox
 *
 * License:
 *              MIT License. All code unless otherwise specified is
 *              Copyright (c) Matthew Knox and Contributors 2017.
 */

const fs = require('fs'),
    path = require('path'),
    util = require('util'),
    client = require('scoped-http-client'),
    git = require('concierge/git'),
    files = require('concierge/files');

class FirstRun {
    async _getJsonFile (file) {
        try {
            return await files.readJson(file);
        }
        catch (e) {
            return null;
        }
    }

    _getJson (data) {
        try {
            return JSON.parse(data.replace(/^\uFEFF/, ''));
        }
        catch (e) {
            return null;
        }
    }

    async _getRemoteDefaults (globalConfig) {
        const potentialDefaultUrls = [
            globalConfig.url || null,
            this.config.url || null,
            this._getJson(process.env.CONCIERGE_DEFAULTS_URL),
            'https://raw.githubusercontent.com/wiki/concierge/Concierge/Defaults.md'
        ];
        const url = potentialDefaultUrls.find(p => !!p);
        try {
            const response = await util.promisify(client.create(url).get)();
            const tableArea = response.body.substring(response.body.indexOf('***') + 3, response.body.lastIndexOf('***')),
                relevantArea = tableArea.substring(tableArea.indexOf('--|\n') + 4),
                defaults = relevantArea.split(/\r?\n/)
                    .map(r => r.split('|').map(s => s.trim()).filter(s => !!s)
                    .slice(0, 2).reverse()).filter(r => r.length === 2);
            return defaults;
        }
        catch (e) {
            return null;
        }
    }

    async _getInstalledVersion (installPath) {
        const descriptor = await this._getJsonFile(path.join(installPath, 'kassy.json')) ||
            await this._getJsonFile(path.join(installPath, 'hubot.json')) ||
            await this._getJsonFile(path.join(installPath, 'package.json'));
        if (typeof(descriptor.version) === 'string') {
            return descriptor.version;
        }
        // convert to semver
        const spl = descriptor.version.toString().split('.');
        return spl.concat(Array(3 - spl.length).fill('0')).join('.');
    }

    async _installModule (def) {
        LOG.warn($$`Attempting to install module from "${def[0]}"`);
        const installPath = path.join(global.__modulesPath, def[1]);
        try {
            await git.clone(def[0], installPath);
            LOG.warn($$`"${def[1]}" (${await this._getInstalledVersion(installPath)}) is now installed.`);
        }
        catch (err) {
            LOG.critical(err);
            LOG.error($$`Failed to install module from "${def[0]}"`);
        }
        return true;
    }

    async load (platform) {
        const globalConfig = platform.config.getSystemConfig('defaults');
        const potentialDefaults = [
            await this._getJsonFile(global.rootPathJoin('defaults.json')),
            globalConfig.list || null,
            this.config.list || null,
            this._getJson(process.env.CONCIERGE_DEFAULTS),
            await this._getRemoteDefaults(globalConfig)
        ];
        const defaultModules = potentialDefaults.find(p => !!p);
        if (!defaultModules) {
            return LOG.error('No defaults list is available to install.');
        }
        await Promise.all(defaultModules.map(def => this._installModule(def)));
        platform.modulesLoader.unloadModule(this);
    }

    unload (platform) {
        const dir = this.__descriptor.folderPath;
        platform.modulesLoader.once('unload', async() => {
            await files.deleteDirectory(dir);
            platform.modulesLoader.loadAllModules();
        });
    }
}

module.exports = new FirstRun();
