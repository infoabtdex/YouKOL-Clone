/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "rpstkgovi0ay9x9",
    "created": "2025-03-17 06:47:47.409Z",
    "updated": "2025-03-17 06:47:47.409Z",
    "name": "preferences",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "7xhpipis",
        "name": "userID",
        "type": "relation",
        "required": false,
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
  const collection = dao.findCollectionByNameOrId("rpstkgovi0ay9x9");

  return dao.deleteCollection(collection);
})
