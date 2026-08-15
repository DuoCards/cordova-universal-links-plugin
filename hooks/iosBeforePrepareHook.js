/*
Hook executed before the 'prepare' stage. Only for iOS project.
It will check if project name has changed. If so - it will change the name of the .entitlements file to remove that file duplicates.
If file name has no changed - hook will do nothing.
*/

var path = require('path');
var fs = require('fs');
var ConfigXmlHelper = require('./lib/configXmlHelper.js');

module.exports = function(ctx) {
  var iosProjectFilePath = path.join(ctx.opts.projectRoot, 'platforms', 'ios');
  if (usesCordovaIos8ProjectStructure(iosProjectFilePath)) {
    return;
  }

  run(ctx, iosProjectFilePath);
};

/**
 * Run the hook logic.
 *
 * @param {Object} ctx - cordova context object
 * @param {String} iosProjectFilePath absolute path to ios platform directory
 */
function run(ctx, iosProjectFilePath) {
  var configXmlHelper = new ConfigXmlHelper(ctx);
  var newProjectName = configXmlHelper.getProjectName();

  var oldProjectName = getOldProjectName(iosProjectFilePath);

  // if name has not changed - do nothing
  if (oldProjectName.length && oldProjectName === newProjectName) {
    return;
  }

  console.log('Project name has changed. Renaming .entitlements file.');

  // if it does - rename it
  var oldEntitlementsFilePath = path.join(iosProjectFilePath, oldProjectName, 'Resources', oldProjectName + '.entitlements');
  var newEntitlementsFilePath = path.join(iosProjectFilePath, oldProjectName, 'Resources', newProjectName + '.entitlements');

  try {
    fs.renameSync(oldEntitlementsFilePath, newEntitlementsFilePath);
  } catch (err) {
    console.warn('Failed to rename .entitlements file.');
    console.warn(err);
  }
}

/**
 * Cordova iOS 8 uses fixed App/Entitlements-{Debug,Release}.plist files.
 * They are managed during prepare and must not be renamed.
 *
 * @param {String} iosProjectFilePath absolute path to ios platform directory
 * @return {Boolean} whether the generated project uses the Cordova iOS 8 structure
 */
function usesCordovaIos8ProjectStructure(iosProjectFilePath) {
  return fs.existsSync(path.join(iosProjectFilePath, 'App', 'Entitlements-Debug.plist'));
}

// region Private API

/**
 * Get old name of the project.
 * Name is detected by the name of the .xcodeproj file.
 *
 * @param {String} projectDir absolute path to ios project directory
 * @return {String} old project name
 */
function getOldProjectName(projectDir) {
  var files = [];
  try {
    files = fs.readdirSync(projectDir);
  } catch (err) {
    return '';
  }

  var projectFile = '';
  files.forEach(function(fileName) {
    if (path.extname(fileName) === '.xcodeproj') {
      projectFile = path.basename(fileName, '.xcodeproj');
    }
  });

  return projectFile;
}

// endregion
