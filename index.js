const _ = require('lodash');

module.exports = {

  moogBundle: {

    modules: [ 
      'apostrophe-selective-permissions-doc-type-manager', 
      'apostrophe-selective-permissions-permissions',
      'apostrophe-selective-permissions-admin-bar',
      'apostrophe-selective-permissions-pages'
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
      if (req.data.page && self.hasselectivePagePermissions(req)) {
        contextMenu.push({
          action: 'update-page',
          label: 'Page Settings'
        });
      }
      if (req.data.piece && self.hasselectivePiecePermissions(req)) {
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

    self.hasselectivePagePermissions = function(req) {
      if (!req.user) {
        return false;
      }
      const manager = self.apos.docs.getManager(req.data.page.type);
      const selectivePermissions = manager.options.selectivePermissions;
      const found = _.find(_.keys(selectivePermissions), function(name) {
        return req.user._permissions[name];
      });
      return !!found;
    };

    self.hasselectivePiecePermissions = function(req) {
      if (!req.user) {
        return false;
      }
      const manager = self.apos.docs.getManager(req.data.piece.type);
      const selectivePermissions = manager.options.selectivePermissions;
      const found = _.find(_.keys(selectivePermissions), function(name) {
        return req.user._permissions[name];
      });
      return !!found;
    };

    self.on('apostrophe:modulesReady', 'buildByModule', function() {
      _.each(self.apos.modules, function(module, name) {
        if (self.apos.instanceOf(module, 'apostrophe-pieces')) {
          if (module.options.selectivePermissions) {
            self.byModule[module.__meta.name] = module.options.selectivePermissions;
          }
        }
        if (self.apos.instanceOf(module, 'apostrophe-custom-pages')) {
          if (module.options.selectivePermissions) {
            self.byModule['apostrophe-pages'] = module.options.selectivePermissions;
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
