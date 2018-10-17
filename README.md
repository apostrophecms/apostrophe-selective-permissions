 Create specialized permissions for users of your site, such as an "seo" permission that allows updating only certain fields of certain pieces and pages.

## Stability (pre-alpha)

**This doesn't work yet.** A work in progress. Pardon our dust.

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
          // insert: false,
          // trash: false,
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
* `update: { ... }`: we can edit existing articles, but only the `title` and `seoTitle` fields.
* `seeOtherFields: true`: other fields can be seen in the editor, but are read-only. Otherwise they cannot be seen at all.
* We can't insert (create) articles. `insert: false` is the default.
* We can't trash (or rescue) articles. `trash: false` is the default.
* We can `submit` articles. This is relevant only if `apostrophe-workflow` is also enabled. Recommended when using workflow.

## Allowing the SEO team to edit *all* pieces

This is great if we only want to let our SEO consultants edit articles. But what if we want to let them edit all existing pieces? No problem:

```javascript
  `apostrophe-nuanced-permissions`: { ... same as above ... },
  'apostrophe-pieces': {
    extend: 'apostrophe-pieces',
    nuancedPermissions: {
      seo: {
        update: {
          fields: [ 'title', 'seoTitle' ],
          seeOtherFields: true
        },
        manage: true,
        // insert: false,
        // trash: false,
        submit: true
      }
    }
  }
```

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
          manage: true,
          move: true,
          // insert: false,
          submit: true
      }
    },
    'apostrophe-pieces': { ... see earlier example, if you wish ... }
  }
```

Permissions for pages are managed via the `apostrophe-custom-pages` module.

Here `manage` refers to being able to see the "Reorganize" view (aka "Pages"). 

The `move` action refers to moving a page in the page tree. It implies they can `trash` the page, too.

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

## IMPORTANT: reserved verbs and naming restrictions

Do **not** use the following names for your nuanced permissions:

`edit`, `publish`, `admin`, `guest`

Choose new verbs of your own.

Do **not** use hyphens in your permission names. However, youMayUseCamelCase.

## "What's all this about user groups?"

If you don't see "Groups" on your admin bar, you probably still have a `groups` option configured for the `apostrophe-users` module, either in `app.js` or in `lib/modules/apostrophe-users/index.js`. If you are using this module, you probably want to remove that `groups` option. Now you can create as many groups as you wish and assign them permissions dynamically.

