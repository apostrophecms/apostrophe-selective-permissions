module.exports = {
  construct: function(self, options) {
    const superCan = self.can;
    self.can = function(req, action, object, newObject) {
      return self.simulateAdminPermission(req, action, object || newObject, function() {
        return superCan(req, action, object, newObject);
      }
    };
    const superCriteria = self.criteria;
    self.criteria = function(req, action) {
      return self.simulateAdminPermission(req, action, false, function() {
        return superCriteria(req, action);
      }
    };
    self.simulateAdminPermission = function(req, action, object, fn) {
      const nuancedPermissions = self.apos.modules['apostrophe-nuanced-permissions'];
      if (!self.suitableRoute(req.url)) {
        return fn();
      }
      if (action.match(/^edit\-/)) {
        const matches = action.match(self.permissionPattern);
        const verb = matches[1];
        let type = matches[2];
        type = self.getEffectiveTypeName((object && object.type) ? object.type : type);
        if (!nuancedPermissions.byType[type]) {
          return fn();
        }
        // Check whether the verb the user is carrying out, as determiend by
        // the route (see `suitableRoute` which adds this annotation to `req`),
        // is permissible on this doc type for one of the nuanced permissions the user
        // possesses
        if (!_.find(_.keys(nuancedPermissions.byType[type], function(key) {
          if (req.user._permissions[key]) {
            const options = nuancedPermissions.byType[type][key];
            return options[req.aposVerb];
          }
        }))) {
          return fn();
        }
        const key = 'admin-' + type;
        const preserve = req.user._permissions[key];
        req.user._permissions[key] = true;
        const result = fn();
        req.user._permissions[key] = preserve;
        return result;
      }
    };

    // Check whether the URL matches one of the routes to which we
    // safely add this feature. If not, it's not safe to let the user
    // interact in this way, even if the route is designed for editing
    // a property permitted by a nuanced permission

    self.suitableRoute = function() {
      const matches = req.url.match(/^\/modules\/([^\/]+)\/[^\/]$/);
      if (!matches) {
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
        'fetch-to-update': 'update'        
      };
      if (!aposVerbMap[verb]) {
        return false;
      }
      req.aposVerb = aposVerbMap[verb];
      return true;
    };
  }
};
