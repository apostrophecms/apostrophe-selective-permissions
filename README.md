 Create specialized permissions for users of your site, such as an "seo" permission that allows updating only certain fields of certain pieces and pages.

## Stability: alpha

## Installation

```
npm install apostrophe-nuanced-permissions
```

## Configuration

```javascript
// in app.js
modules: {
  `apostrophe-nuanced-permissions`: {
    permissions: [
      {
        name: 'seo',
        label: 'SEO'
      }
    ]
  },
  'articles': {
    extend: 'apostrophe-pieces',
    nuancedPermissions: {
      seo: {
          update: {
            fields: [ 'title', 'seoTitle' ],
            seeOtherFields: true
          },
          submit: true
      }
    }
  }
}
```

## What does this configuration say?

In the `permissions` array of `apostrophe-nuanced-permissions`, we start by listing some permissions we'd like to be able to assign when we edit Apostrophe's user groups. We give each a name and a label.

Then, in the `nuancedPermissions` option of `articles` (which extends `apostrophe-pieces`), we define what the `seo` permission lets us do with articles:

* We can manage them (open up the "Manage Articles" dialog and see the list). If you configure the permission at all for a doc type, then this is implicitly allowed for it. 
* `update: { ... }`: we can edit existing articles, but only the `title` and `tags` fields.
* `seeOtherFields: true`: other fields can be seen in the editor, but are read-only. By default, they cannot be seen at all.
* We can `submit` articles. This is relevant only if `apostrophe-workflow` is also enabled. Recommended when using workflow.

These are currently the only forms of limited access that can be given out via this module. Further expansion is anticipated.

## Allowing the SEO team to edit *all* pieces

This is great if we only want to let our SEO consultants edit articles. But what if we want to let them edit all existing pieces? No problem! We just need to configure `apostrophe-pieces` in `lib/modules/apostrophe-pieces/index.js`.

> Note that this must happen in `lib/modules/apostrophe-pieces/index.js` and NOT in app.js, so that Apostrophe does not try to actually add `apostrophe-pieces` itself as a module. We just want to influence the behavior of modules that extend it.

```javascript
// in lib/modules/apostrophe-pieces/index.js
const _ = require('lodash');
module.exports = {
  beforeConstruct: function(self, options) {
    options.nuancedPermissions = _.merge({
      seo: {
        update: {
          fields: [ 'title', 'tags' ],
          seeOtherFields: true
        },
        submit: true
      }
    }, options.nuancedPermissions || {});
  }
}
```

We use `beforeConstruct` and `_.merge` to incorporate any further configuration of `nuancedPermissions` for individual pieces modules.

These settings will be inherited by other pieces modules. We can adjust what is inherited by configuring those modules too.

> No matter what we say here, the SEO consultants will never be able to edit an `apostrophe-user` or `apostrophe-group`, because these types are marked `adminOnly` in Apostrophe for security reasons.

## Allowing the SEO team to edit page settings

```javascript
  `apostrophe-nuanced-permissions`: { ... same as above ... },
  'apostrophe-custom-pages': {
    nuancedPermissions: {
      seo: {
          edit: {
            fields: [ 'title', 'seoTitle' ],
            seeOtherFields: true
          },
          submit: true
      }
    },
    'apostrophe-pieces': { ... see earlier example, if you wish ... }
  }
```

Note that permissions for all types of pages are managed via configuration of the `apostrophe-custom-pages` module.

## More than one permission

You can configure more than one nuanced permission in the array, and you can configure what each permission can do:

```javascript
// in app.js
modules: {
  `apostrophe-nuanced-permissions`: {
    permissions: [
      {
        name: 'seo',
        label: 'SEO'
      },
      {
        // Do not use "publish", that verb is reserved
        name: 'publishIt',
        label: 'Publish'
      }
    ]
  },
  'articles': {
    extend: 'apostrophe-pieces',
    nuancedPermissions: {
      seo: {
        edit: {
          fields: [ 'title', 'seoTitle' ],
          seeOtherFields: true
        },
        manage: true,
        // insert: false,
        // trash: false,
        submit: true
      },
      publishIt: {
        edit: {
          fields: [ 'published' ]
        }
      }
    }
  }
}
```

## IMPORTANT: reserved permission names and permission naming restrictions

**Do not** use the following names for your nuanced permissions:

`edit`, `publish`, `admin`, `guest`

Choose new verbs of your own.

**Do not** use hyphens in your permission names. However, youMayUseCamelCase.

## Who should NOT be given nuanced permissions?

Nuanced permissions should only be given out to **groups that cannot already edit the document types in question.** They should *not* be checked off for administrators, or even for groups that can fully edit some or all pieces of a particular type. **Due to technical limitations, if a user is given a nuanced permission like `seo`, Apostrophe  assumes that is the only type of edit they can make** to the relevant type of document.

You *may* give two *different* nuanced permissions to the same group, as long as they apply to different document types.

## "What's all this about user groups?"

If you don't see "Groups" on your admin bar, you probably still have a `groups` option configured for the `apostrophe-users` module, either in `app.js` or in `lib/modules/apostrophe-users/index.js`. If you are using this module, you probably want to remove that `groups` option. Now you can create as many groups as you wish and assign them permissions dynamically.


