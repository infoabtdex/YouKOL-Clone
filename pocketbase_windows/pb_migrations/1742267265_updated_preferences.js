/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_432047489")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "json3912345333",
    "maxSize": 0,
    "name": "preferences",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_432047489")

  // remove field
  collection.fields.removeById("json3912345333")

  return app.save(collection)
})
