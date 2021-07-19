# directus-migrate

Usage:

```sh
npx directus-migrate config.json
```

Example config:

```json
{
  "dry": false,
  "source": {
    "url": "https://directus-source.domain.tld",
    "token": "source admin user token"
  },
  "target": {
    "url": "https://directus-target.domain.tld",
    "token": "target admin user token"
  }
}
```

- Only migrates the data models for `collections`, `fields`, and `relations`. No items (data) is migrated.
- Does not remove missing data models.
- Use with caution, backup your data before attempting this.
