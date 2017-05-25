> This documentation is unmaintained. For up to date documentation, please see [https://github.com/concierge/Concierge/wiki/Defaults](https://github.com/concierge/Concierge/wiki/Defaults).

## Default Commands
On the first install of Concierge, this module will install the following modules (if git is in the path and there is an internet connection, otherwise they must be manually installed):
***
|Name|Git URL|Description|
|----|-------|-----------|
|boss|https://github.com/concierge/boss.git|A web-based admin control panel for Concierge.|
|creator|https://github.com/concierge/creator.git|Displays information about the creators of Concierge.|
|help|https://github.com/concierge/help.git|Displays module help.|
|kpm|https://github.com/concierge/kpm.git|Package Manager, assists with the installing and managing of packages.|
|ping|https://github.com/concierge/ping.git|Displays information about the current Concierge instance.|
|restart|https://github.com/concierge/restart.git|Restarts Concierge, performing a full code hotswap.|
|shutdown|https://github.com/concierge/shutdown.git|Performs a safe shutdown of Concierge. Equivalent to a CTRL-C.|
|update|https://github.com/concierge/update.git|Updates Concierge.|
|test|https://github.com/concierge/test.git|The default command line integration for Concierge.|
***

Additional modules can be installed into the modules directory. Refer to the KPM table for named modules.

#### Custom Defaults
Custom defaults can be specified by one of five approaches (in order of precedence):

1. Create a file called `defaults.json` in the Concierge root directory. This file should have the following format (git URL, name):
```json
[
    ["https://github.com/concierge/creator.git", "creator"],
    ["https://github.com/concierge/help.git", "help"],
    ["https://github.com/concierge/kpm.git", "kpm"],
    ["https://github.com/concierge/ping.git", "ping"],
    ["https://github.com/concierge/restart.git", "restart"],
    ["https://github.com/concierge/shutdown.git", "shutdown"],
    ["https://github.com/concierge/update.git", "update"],
    ["https://github.com/concierge/test.git", "test"]
]
```

2. Add the same structure as `defaults.json` into the system configuration file under `defaults.list`. E.g.:
```json
{
    "defaults": {
        "list": [
            ["https://github.com/concierge/creator.git", "creator"]
        ]
    }
}
```

3. Add the same structure as `defaults.json` into the `first-run` module configuration file under `list`.
4. Add the same structure as `defaults.json` to an environment variable called `CONCIERGE_DEFAULTS`.
5. Set any of the following to the url of a new table (like the one on this page) from which to look up defaults:
    - System configuration file, `defaults.url`
    - `first-run` configuration file, `url`
    - Envirionment variable, `CONCIERGE_DEFAULTS_URL`
