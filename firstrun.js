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
    client = require('scoped-http-client'),
    path = require('path'),
    git = require('concierge/git'),
    files = require('concierge/files');

class FirstRun {
    _getJsonFile (file) {
        try {
            return this._getJson(fs.readFileSync(file, 'utf8'));
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

    _getRemoteDefaults (globalConfig) {
        return new Promise(resolve => {
            const potentialDefaultUrls = [
                globalConfig.url || null,
                this.config.url || null,
                this._getJson(process.env.CONCIERGE_DEFAULTS_URL),
                'https://raw.githubusercontent.com/wiki/concierge/Concierge/Defaults.md'
            ];
            const url = potentialDefaultUrls.find(p => !!p);
            client.create(url).get()((err, response, body) => {
                if (err) {
                    resolve(null);
                }
                else {
                    const tableArea = body.substring(body.indexOf('***') + 3, body.lastIndexOf('***')),
                        relevantArea = tableArea.substring(tableArea.indexOf('--|\n') + 4),
                        defaults = relevantArea.split(/\r?\n/)
                            .map(r => r.split('|').map(s => s.trim()).filter(s => !!s)
                            .slice(0, 2).reverse()).filter(r => r.length === 2);
                    resolve(defaults);
                }
            });
        });
    }

    _getInstalledVersion (installPath) {
        const descriptor = this._getJsonFile(path.join(installPath, 'kassy.json')) ||
            this._getJsonFile(path.join(installPath, 'hubot.json')) ||
            this._getJsonFile(path.join(installPath, 'package.json'));
        if (typeof(descriptor.version) === 'string') {
            return descriptor.version;
        }
        // convert to semver
        const spl = descriptor.version.toString().split('.');
        return spl.concat(Array(3 - spl.length).fill('0')).join('.');
    }

    _installModule (def) {
        return new Promise(resolve => {
            LOG.warn($$`Attempting to install module from "${def[0]}"`);
            const installPath = path.join(global.__modulesPath, def[1]);
            git.clone(def[0], installPath, err => {
                if (err) {
                    LOG.critical(err);
                    LOG.error($$`Failed to install module from "${def[0]}"`);
                }
                else {
                    LOG.warn($$`"${def[1]}" (${this._getInstalledVersion(installPath)}) is now installed.`);
                }
                resolve(true);
            });
        });
    }

    load (platform) {
        const globalConfig = platform.config.getSystemConfig('defaults');
        this._getRemoteDefaults(globalConfig).then(remoteDefaults => {
            const potentialDefaults = [
                this._getJsonFile(global.rootPathJoin('defaults.json')),
                globalConfig.list || null,
                this.config.list || null,
                this._getJson(process.env.CONCIERGE_DEFAULTS),
                remoteDefaults
            ];
            const defaultModules = potentialDefaults.find(p => !!p);
            if (!defaultModules) {
                LOG.error('No defaults list is available to install.');
                return;
            }
            const installPromises = [];
            for (let def of defaultModules) {
                installPromises.push(this._installModule(def));
            }
            Promise.all(installPromises).then(() => {
                platform.modulesLoader.unloadModule(this);
            });
        });
    }

    unload (platform) {
        const dir = this.__descriptor.folderPath;
        platform.modulesLoader.once('unload', () => {
            files.deleteDirectory(dir, () => platform.modulesLoader.loadAllModules());
        });
    }
}

module.exports = new FirstRun();
