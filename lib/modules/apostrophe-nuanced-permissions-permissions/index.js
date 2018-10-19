const _ = require('lodash');

module.exports = {

  improve: 'apostrophe-permissions',

  construct: function(self, options) {

    const superCan = self.can;
    self.can = function(req, action, object, newObject) {
      return self.nuancedSimulateAdminPermission(req, action, object || newObject, false, function() {
        return superCan(req, action, object, newObject);
      });
    };

    const superCriteria = self.criteria;
    self.criteria = function(req, action) {
      return self.nuancedSimulateAdminPermission(req, action, false, true, function() {
        return superCriteria(req, action);
      });
    };

    self.nuancedSimulateAdminPermission = function(req, action, object, criteria, fn) {
      if (!req.user) {
        return fn();
      }
      if (!(req.aposNuancedVerb || self.nuancedSuitableRoute(req))) {
        return fn();
      }
      const nuancedPermissions = self.apos.modules['apostrophe-nuanced-permissions'];
      const added = {};
      _.each(nuancedPermissions.byModule, (options, moduleName) => {
        _.each(options, (details, permissionName) => {
          if (!req.user._permissions[permissionName]) {
            return;
          }
          let key;
          if (moduleName === 'apostrophe-pages') {
            key = 'admin-apostrophe-page';
          } else {
            key = 'admin-' + self.apos.modules[moduleName].name;
          }
          if (details[req.aposNuancedVerb] && (!req.user._permissions[key])) {
            added[key] = true;
            req.user._permissions[key] = true;
            if (req.user._permissionsLocales) {
              // workflow-aware
              req.user._permissionsLocales[key] = req.user._permissionsLocales[permissionName];
            }
          }
        });
      });
      const result = fn();
      _.each(added, function(dummy, name) {
        req.user._permissions[name] = false;
      });
      return result;
    };

    // Check whether the URL matches one of the routes to which we
    // safely add this feature. If not, it's not safe to let the user
    // interact in this way, even if the route is designed for editing
    // a property permitted by a nuanced permission

    self.nuancedSuitableRoute = function(req) {
      const lockRoutes = [
        '/modules/apostrophe-docs/lock',
        '/modules/apostrophe-docs/verify-lock',
        '/modules/apostrophe-docs/unlock',
        '/modules/apostrophe-workflow/submit'
      ];
      if (_.includes(lockRoutes, req.url)) {
        req.aposNuancedVerb = 'update';
        return true;
      }
      const nuancedPermissions = self.apos.modules['apostrophe-nuanced-permissions'];
      const matches = req.url.match(/^\/modules\/([^\/]+)\/([^\/\?]+)(\?|$)/);
      if (!matches) {
        return false;
      }
      const module = matches[1];
      if (!_.has(nuancedPermissions.byModule, module)) {
        return false;
      }
      const verb = matches[2];
      const aposVerbMap = {
        insert: 'insert',
        retrieve: 'retrieve',
        list: 'retrieve',
        update: 'update',
        'manager-modal': 'retrieve',
        'editor-modal': 'update',
        'fetch-to-update': 'update',
        'editor': 'update'
      };
      if (!aposVerbMap[verb]) {
        return false;
      }
      req.aposNuancedVerb = aposVerbMap[verb];
      return true;
    };

  }

};
