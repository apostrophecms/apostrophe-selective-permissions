// This module exists because we have to override
// sendPage to modify `contextMenu`. `apostrophe-pages:beforeSend`
// is too late, which would be nice to fix.

module.exports = {
  improve: 'apostrophe-pages',
  construct: function(self, options) {
    const superSendPage = self.sendPage;
    self.sendPage = function(req, template, data) {
      const menu = self.apos.modules['apostrophe-selective-permissions'].contextMenu(req);
      if (menu) {
        data.contextMenu = menu;
      }
      return superSendPage(req, template, data);
    };
  }
};
