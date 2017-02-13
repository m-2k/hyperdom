var vhtml = require('./vhtml');
var domComponent = require('./domComponent');
var bindingMeta = require('./meta');
var toVdom = require('./toVdom');
var parseTag = require('virtual-dom/virtual-hyperscript/parse-tag');
var Mount = require('./mount');
var render = require('./render');
var deprecations = require('./deprecations');
var prepareAttributes = require('./prepareAttributes')
var refreshify = require('./refreshify')
var binding = require('./binding')
var refreshAfter = require('./refreshAfter')

exports.append = function (element, render, model, options) {
  return startAttachment(render, model, options, function(mount, domComponentOptions) {
    var component = domComponent.create(domComponentOptions);
    var vdom = mount.render();
    element.appendChild(component.create(vdom));
    return component;
  });
};

exports.replace = function (element, render, model, options) {
  return startAttachment(render, model, options, function(mount, domComponentOptions) {
    var component = domComponent.create(domComponentOptions);
    var vdom = mount.render();
    element.parentNode.replaceChild(component.create(vdom), element);
    return component;
  });
};

exports.appendVDom = function (vdom, render, model, options) {
  return startAttachment(render, model, options, function(mount) {
    var component = {
      create: function(newVDom) {
        vdom.children = [];
        if (newVDom) {
          vdom.children.push(newVDom);
        }
      },
      update: function(newVDom) {
        vdom.children = [];
        if (newVDom) {
          vdom.children.push(newVDom);
        }
      }
    };
    component.create(mount.render());
    return component;
  });
};

function startAttachment(render, model, options, attachToDom) {
  if (typeof render == 'object' && typeof render.render == 'function') {
    return start(render, attachToDom, model);
  } else {
    deprecations.renderFunction('hyperdom.append and hyperdom.replace with render functions are deprecated, please pass a ViewModel');
    return start({render: function () { return render(model); }}, attachToDom, options);
  }
}

function start(model, attachToDom, options) {
  var mount = new Mount(model, options);
  render(mount, function () {
    if (options) {
      var domComponentOptions = {document: options.document};
    }
    mount.component = attachToDom(mount, domComponentOptions);
  });
  return mount;
}

/**
 * this function is quite ugly and you may be very tempted
 * to refactor it into smaller functions, I certainly am.
 * however, it was written like this for performance
 * so think of that before refactoring! :)
 */
exports.html = function (hierarchySelector) {
  var hasHierarchy = hierarchySelector.indexOf(' ') >= 0;
  var selector, selectorElements;

  if (hasHierarchy) {
    selectorElements = hierarchySelector.match(/\S+/g);
    selector = selectorElements[selectorElements.length - 1];
  } else {
    selector = hierarchySelector;
  }

  var childElements;
  var vdom;
  var tag;
  var attributes = arguments[1];

  if (attributes && attributes.constructor == Object && typeof attributes.render !== 'function') {
    childElements = toVdom.recursive(Array.prototype.slice.call(arguments, 2));
    prepareAttributes(selector, attributes, childElements);
    tag = parseTag(selector, attributes);
    vdom = vhtml(tag, attributes, childElements);
  } else {
    attributes = {};
    childElements = toVdom.recursive(Array.prototype.slice.call(arguments, 1));
    tag = parseTag(selector, attributes);
    vdom = vhtml(tag, attributes, childElements);
  }

  if (hasHierarchy) {
    for(var n = selectorElements.length - 2; n >= 0; n--) {
      vdom = vhtml(selectorElements[n], {}, [vdom]);
    }
  }

  return vdom;
};

exports.jsx = function (tag, attributes) {
  var childElements = toVdom.recursive(Array.prototype.slice.call(arguments, 2));
  if (attributes) {
    prepareAttributes(tag, attributes, childElements);
  }
  return vhtml(tag, attributes || {}, childElements);
};

Object.defineProperty(exports.html, 'currentRender', {get: function () {
  deprecations.currentRender('hyperdom.html.currentRender is deprecated, please use hyperdom.currentRender() instead');
  return render._currentRender;
}});

Object.defineProperty(exports.html, 'refresh', {get: function () {
  deprecations.refresh('hyperdom.html.refresh is deprecated, please use viewModel.rerender() instead');
  if (render._currentRender) {
    var currentRender = render._currentRender
    return function(result) {
      refreshify.refreshAfterEvent(result, currentRender.mount)
    }
  } else {
    throw new Error('Please assign hyperdom.html.refresh during a render cycle if you want to use it in event handlers. See https://github.com/featurist/hyperdom#refresh-outside-render-cycle');
  }
}});

Object.defineProperty(exports.html, 'norefresh', {get: function () {
  deprecations.refresh('hyperdom.html.norefresh is deprecated, please use hyperdom.norefresh() instead');
  return refreshify.norefresh
}});

Object.defineProperty(exports.html, 'binding', {get: function () {
  deprecations.refresh('hyperdom.html.binding() is deprecated, please use hyperdom.binding() instead');
  return binding
}});

Object.defineProperty(exports.html, 'refreshAfter', {get: function () {
  deprecations.refresh("hyperdom.html.refreshAfter() is deprecated, please use require('hyperdom/refreshAfter')() instead");
  return refreshAfter
}});

exports.html.meta = bindingMeta;

function rawHtml() {
  var selector;
  var html;
  var options;

  if (arguments.length == 2) {
    selector = arguments[0];
    html = arguments[1];
    options = {innerHTML: html};
    return exports.html(selector, options);
  } else {
    selector = arguments[0];
    options = arguments[1];
    html = arguments[2];
    options.innerHTML = html;
    return exports.html(selector, options);
  }
}

exports.html.rawHtml = rawHtml;
