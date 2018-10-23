module.exports = {
  improve: 'apostrophe-admin-bar',
  construct: function(self, options) {
    const superItemIsVisible = self.itemIsVisible;
    // Convince the permissions call that we're querying an edit permission
    // just to decide if a manage view should be available or not
    self.itemIsVisible = function(req, item) {
      const matches = item.permission && item.permission.match(/^edit-(.*)$/);
      if (!matches) {
        return superItemIsVisible(req, item);
      }
      req.aposselectiveVerb = 'retrieve';
      const result = superItemIsVisible(req, item);
      delete req.aposselectiveVerb;
      return result;
    };
  }
};
