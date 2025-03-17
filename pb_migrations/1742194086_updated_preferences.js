/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("rpstkgovi0ay9x9")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "spgdtku7",
    "name": "preferences",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("rpstkgovi0ay9x9")

  // remove
  collection.schema.removeField("spgdtku7")

  return dao.saveCollection(collection)
})
