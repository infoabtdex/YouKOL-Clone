/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("rmtsgacpz8ywzlj")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ziv6yxbw",
    "name": "display_name",
    "type": "text",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 1,
      "max": 100,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "rz3epskq",
    "name": "bio",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": 500,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "oxyufofs",
    "name": "onboarding_completed",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "yved16qw",
    "name": "content_types",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 2000000
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "qjq9j4h5",
    "name": "preferences",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 2000000
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("rmtsgacpz8ywzlj")

  // remove
  collection.schema.removeField("ziv6yxbw")

  // remove
  collection.schema.removeField("rz3epskq")

  // remove
  collection.schema.removeField("oxyufofs")

  // remove
  collection.schema.removeField("yved16qw")

  // remove
  collection.schema.removeField("qjq9j4h5")

  return dao.saveCollection(collection)
})
