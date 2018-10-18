const _ = require('lodash');

module.exports = {
  moogBundle: {
    modules: [ 
      'apostrophe-nuanced-permissions-doc-type-manager', 
      'apostrophe-nuanced-permissions-permissions',
      'apostrophe-nuanced-permissions-admin-bar'
    ],
    directory: 'lib/modules'
  },
  construct: function(self, options) {
    self.byType = {};
    self.byModule = {};
    self.on('apostrophe:modulesReady', 'buildByType', function() {
      _.each(self.apos.modules, function(module, name) {
        if (self.apos.instanceOf(module, 'apostrophe-pieces') || self.apos.instanceOf(module, 'apostrophe-custom-pages')) {
          if (module.options.nuancedPermissions) {
            self.byModule[module.__meta.name] = module.options.nuancedPermissions;
            self.byType[module.name] = module.options.nuancedPermissions;
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
