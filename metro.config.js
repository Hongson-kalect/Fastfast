const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
 
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
 
// Bỏ qua output build native (android/build, android/app/build, .gradle: hàng GB file).
// Không chặn thì mỗi lần build Gradle Metro phải quét lại và bị treo.
const nativeBuildDirs = /[\\/]android[\\/](app[\\/])?(build|\.gradle|\.cxx)[\\/].*/;
config.resolver.blockList = [].concat(config.resolver.blockList ?? [], nativeBuildDirs);
 
module.exports = withNativewind(config);