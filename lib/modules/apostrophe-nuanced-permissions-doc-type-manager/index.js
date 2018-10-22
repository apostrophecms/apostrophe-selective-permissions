const _ = require('lodash');

module.exports = {

  improve: 'apostrophe-doc-type-manager',

  afterConstruct: function(self) {
    // We have to do this late because they are introduced
    // in subclasses
    self.composeNuancedPermissions();
    self.overrideEditControls();
  },

  construct: function(self, options) {

    self.overrideEditControls = function() {
      if (self.getEditControls) {
        const superGetEditControls = self.getEditControls;
        self.getEditControls = function(req) {
          const has = self.getNuancedPermission(req);
          if (!has) {
            return superGetEditControls(req);
          }
          if (!has.update) {
            return superGetEditControls(req);
          }
          return [
            {
              type: 'minor',
              action: 'cancel',
              label: 'Cancel'
            }
          ].concat(has.submit ? [
            {
              type: 'minor',
              label: 'Submit',
              action: 'workflow-submit'
            }
          ] : []).concat([
            {
              type: 'major',
              action: 'save',
              label: 'Save'
            }
          ]);
        };
      }
      if (self.getManagerControls) {
        const superGetManagerControls = self.getManagerControls;
        self.getManagerControls = function(req) {
          if (!self.getNuancedPermission(req)) {
            return superGetManagerControls(req);
          }
          return [
            {
              type: 'major',
              label: 'Finished',
              action: 'cancel'
            }
          ];
        };
      }
      if (self.routes && self.routes.managerModal) {
        var superManagerModal = self.routes.managerModal;
        self.routes.managerModal = function(req, res) {
          if (!self.getNuancedPermission(req)) {
            return superManagerModal(req, res);
          } else {
            const options = _.omit(self.options, 'batchOperations');
            options.batchOperations = [];
            return res.send(self.render(req, 'managerModal', { options: options, schema: self.schema }));
          }
        };
      }
    };

    self.getNuancedPermission = function(req) {
      if (!self.options.nuancedPermissions) {
        return false;
      }
      let has;
      _.each(self.options.nuancedPermissions, function(options, name) {
        if (req.user._permissions[name]) {
          has = options;
          return false;
        }
      });
      return has;
    };

    const superAllowedSchema = self.allowedSchema;

    self.allowedSchema = function(req) {
      let schema = superAllowedSchema(req);
      // If the user has a nuanced permission relating to this module,
      // then we presume that is why they are allowed to edit it, and
      // apply its restrictions. Note this means nuanced permissions
      // are not additive and should not be given out to groups that
      // should have broader control
      if (self.options.nuancedPermissions) {
        const nuancedPermissionName = _.find((req.user && req.user._permissions && _.keys(req.user._permissions)) || [], (name) => {
          return self.options.nuancedPermissions[name];
        });
        if (nuancedPermissionName) {
          const nuancedPermission = self.options.nuancedPermissions[nuancedPermissionName];
          const fields = nuancedPermission.update && nuancedPermission.update.fields;
          if (fields) {
            if (nuancedPermission.update.seeOtherFields) {
              schema = _.map(schema, function(field) {
                if (!_.includes(fields, field.name)) {
                  field = _.clone(field);
                  field.readOnly = true;
                }
                return field;
              });
            } else {
              schema = self.apos.schemas.subset(schema, fields);
            }
          }
        }
      }
      return schema;     
    };

    self.composeNuancedPermissions = function() {
      if (!self.options.nuancedPermissions) {
        return;
      }
      _.each(self.options.nuancedPermissions, (permission, name) => {
        if (permission.update || permission.insert) {
          permission.retrieve = true;
        }
      });
    };

  }
};
