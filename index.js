const _ = require('lodash');

module.exports = {

  moogBundle: {

    modules: [ 
      'apostrophe-nuanced-permissions-doc-type-manager', 
      'apostrophe-nuanced-permissions-permissions',
      'apostrophe-nuanced-permissions-admin-bar',
      'apostrophe-nuanced-permissions-pages'
    ],

    directory: 'lib/modules'

  },

  construct: function(self, options) {

    self.byType = {};

    self.byModule = {};

    self.contextMenu = function(req) {
      const contextMenu = [];
      if (!req.data.page) {
        return false;
      }
      if (req.data.page && self.hasNuancedPagePermissions(req)) {
        contextMenu.push({
          action: 'update-page',
          label: 'Page Settings'
        });
      }
      if (req.data.piece && self.hasNuancedPiecePermissions(req)) {
        const manager = self.apos.docs.getManager(req.data.piece.type);
        contextMenu.push({
          action: 'edit-' + self.apos.utils.cssName(manager.name),
          label: 'Update ' + manager.label,
          value: req.data.piece._id
        });
      }
      if (contextMenu.length) {
        return contextMenu;
      }
      return false;
    };

    self.hasNuancedPagePermissions = function(req) {
      if (!req.user) {
        return false;
      }
      const manager = self.apos.docs.getManager(req.data.page.type);
      const nuancedPermissions = manager.options.nuancedPermissions;
      const found = _.find(_.keys(nuancedPermissions), function(name) {
        return req.user._permissions[name];
      });
      return !!found;
    };

    self.hasNuancedPiecePermissions = function(req) {
      if (!req.user) {
        return false;
      }
      const manager = self.apos.docs.getManager(req.data.piece.type);
      const nuancedPermissions = manager.options.nuancedPermissions;
      const found = _.find(_.keys(nuancedPermissions), function(name) {
        return req.user._permissions[name];
      });
      return !!found;
    };

    self.on('apostrophe:modulesReady', 'buildByModule', function() {
      _.each(self.apos.modules, function(module, name) {
        if (self.apos.instanceOf(module, 'apostrophe-pieces')) {
          if (module.options.nuancedPermissions) {
            self.byModule[module.__meta.name] = module.options.nuancedPermissions;
          }
        }
        if (self.apos.instanceOf(module, 'apostrophe-custom-pages')) {
          if (module.options.nuancedPermissions) {
            self.byModule['apostrophe-pages'] = module.options.nuancedPermissions;
          }
        }
      });
      _.each(self.options.permissions || [], permission => {
        self.apos.permissions.add({
          value: permission.name,
          // We need the edit- prefix so those with the blanket editor permission
          // are good to go, but for a label we want to convey that this is
          // something almost everyone with editing privileges anywhere should be given
          label: permission.label
        });
      });
    });

  }
};
