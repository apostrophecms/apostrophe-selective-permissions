module.exports = {
  moogBundle: [ 'apostrophe-nuanced-permissions-pieces' , 'apostrophe-nuanced-permissions-custom-pages', 'apostrophe-nuanced-permissions-permissions' ],
  construct: function(self, options) {
    self.byType = {};
    self.on('apostrophe', 'modulesReady', 'buildByType', function() {
      _.each(self.apos.modules, function(module, name) {
        if (self.instanceOf(module, 'apostrophe-pieces') || self.instanceOf(module, 'apostrophe-custom-pages')) {
          if (module.nuancedPermissions) {
            self.byType[module.name] = module.nuancedPermissions;
          }
        }
      });
    });
  }
};
