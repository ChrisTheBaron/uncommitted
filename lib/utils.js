var glob = require("glob");
var Q = require("q");
var parseGitStatus = require('parse-git-status');
var execa = require('execa');
var fs = require("fs");

var Utils = module.exports = {

	/**
	 * @param {[String]} paths
	 */
	getPathsToRepos: function (paths) {

		var deferred = Q.defer();

		Utils.validatePaths(paths).then(function () {

			var searchPaths = paths.map((path) => {
				return Utils.rtrim(path, '/');
			});

			var pattern;

			if (searchPaths.length > 1) {
				pattern = `{${searchPaths.join(',')}}`;
			} else {
				pattern = `${searchPaths[0]}`;
			}

			glob(`${pattern}/**/.git`, {follow: true}, (err, files) => {
				if (err) {
					deferred.reject(err);
				} else {
					deferred.resolve(files.map((file) => {
						return file.replace(/(.*)\.git/, '$1');
					}));
				}
			});

		}).catch(deferred.reject).done();

		return deferred.promise;

	},

	validatePaths: function (paths) {
		return Q.fcall(() => {
			if (paths.every(path => fs.statSync(path).isDirectory())) {
				return true;
			} else {
				throw new Error("Invalid paths specified");
			}
		});
	},

	/**
	 * @see https://github.com/kvz/locutus/blob/master/src/php/strings/rtrim.js
	 */
	rtrim: function (str, charlist) {
		charlist = !charlist ? ' \\s\u00A0' : (charlist + '')
			.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^:])/g, '\\$1')

		var re = new RegExp('[' + charlist + ']+$', 'g')

		return (str + '').replace(re, '')
	},

	getRepoStatus: function (pathToRepo) {

		var deferred = Q.defer();

		var old = process.cwd();

		process.chdir(pathToRepo);

		execa('git', ['status', '--porcelain'])
			.then(({stdout}) => {
				process.chdir(old);
				deferred.resolve({
					path: pathToRepo,
					status: parseGitStatus(stdout)
				});
			});

		return deferred.promise;

	},

	/**
	 * @param {[{path, status}]} repos
	 */
	outputStatuses: function (repos, output) {

		return Q.fcall(function () {

			//first just get the repo's with changes
			var dirty = repos.filter((repo) => {
				return (repo.status.length > 0)
			});

			console.log(`${dirty.length} repo's found with uncommitted changes.`);

			if (output == "full") {

				console.log("Details:\n");

				dirty.forEach((repo) => {
					console.log(` - ${repo.path}`);
				});

			}

		});

	},

	printUsage: function () {
		console.log(`Usage: ${process.argv[1].split('/').pop()} [--output t] /path/to/repos [/other/paths]
	--output t: Either "basic" or "full" (default "basic")`)
	}

};
