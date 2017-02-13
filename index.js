var rendering = require('./rendering')
var refreshify = require('./refreshify')
var binding = require('./binding')
var meta = require('./meta');
var render = require('./render')

exports.html = rendering.html;
exports.html.refreshify = refreshify
exports.jsx = rendering.jsx;
exports.attach = rendering.attach;
exports.replace = rendering.replace;
exports.append = rendering.append;
exports.appendVDom = rendering.appendVDom;
exports.binding = binding;
exports.meta = meta;
exports.refreshify = refreshify;
exports.norefresh = refreshify.norefresh;

exports.currentRender = render.currentRender
