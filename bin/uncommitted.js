#! /usr/bin/env node

var Utils = require("../lib/utils");
var Q = require("q");
var minimist = require('minimist');

var argv = minimist(process.argv.slice(2));

if (argv._.length == 0) {
	Utils.printUsage();
	process.exit(1);
}

var output = argv["output"] || "basic";

if (output != "basic" && output != "full") {
	Utils.printUsage();
	process.exit(1);
}

Utils.getPathsToRepos(argv._)
	.then((repos) => {
		return Q.all(repos.map((repo) => {
			return Utils.getRepoStatus(repo);
		}));
	})
	.then((repos) => Utils.outputStatuses(repos, output))
	.catch(console.error)
	.done();

