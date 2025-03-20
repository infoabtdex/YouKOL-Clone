/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "rmtsgacpz8ywzlj",
    "created": "2025-03-20 06:56:04.690Z",
    "updated": "2025-03-20 06:56:04.690Z",
    "name": "user_profiles",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "lqkbtdbl",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("rmtsgacpz8ywzlj");

  return dao.deleteCollection(collection);
})
