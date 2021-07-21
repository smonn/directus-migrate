#!/usr/bin/env node

import { Presets, SingleBar } from "cli-progress";
import equal from "fast-deep-equal";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { DirectusClient, DirectusClientOptions } from "./directus/client";
import { DirectusCollection, DirectusField } from "./directus/types";

export interface Configuration {
  dry?: boolean;
  source: DirectusClientOptions;
  target: DirectusClientOptions;
}

async function nextCollection(collections: DirectusCollection[]) {
  return await inquirer.prompt([
    {
      type: "list",
      name: "name",
      message: "Next collection:",
      choices: collections.map((c) => c.collection),
    },
  ]);
}

async function addLanguages(target: DirectusClient) {
  await target.createCollection({
    collection: "languages",
    fields: [
      {
        field: "code",
        type: "string",
        meta: {
          hidden: false,
          interface: "input",
          readonly: false,
          width: "half",
          options: {
            iconLeft: "vpn_key",
          },
        },
        schema: {
          has_auto_increment: false,
          is_primary_key: true,
          length: 255,
        },
      },
      {
        field: "name",
        type: "string",
        meta: {
          hidden: false,
          interface: "input",
          options: {
            iconLeft: "translate",
          },
          width: "half",
          readonly: false,
        },
        schema: {
          is_nullable: true,
          is_unique: false,
          numeric_precision: null,
          numeric_scale: null,
        },
      },
    ],
    meta: {
      singleton: false,
      archive_app_filter: true,
      icon: "translate",
      display_template: "{{name}}",
    },
  });
}

function logStat(mode: "Updated" | "Created", type: string, amount: number) {
  if (amount > 0) {
    console.log(`${mode} ${amount} ${type}.`);
  }
}

async function main(args: string[]) {
  if (args.length < 3) {
    console.error("Usage: directus-migrate <path/to/config.json>");
    process.exit(1);
  }

  const config = JSON.parse(
    fs.readFileSync(path.resolve(args[2]), "utf8")
  ) as Configuration;

  console.log("🐇 Migrate Directus data model", config.dry ? "[dry run]" : "");
  console.log("");

  const bar = new SingleBar(
    {
      format: `[{bar}] {message}`,
      barsize: 20,
      hideCursor: true,
      clearOnComplete: true,
    },
    Presets.legacy
  );

  const source = new DirectusClient(config.source);
  const target = new DirectusClient(config.target);
  const sourceCollections = await source.getCollections();
  const targetCollections = await target.getCollections();
  const languages = await target.getCollection("languages");
  const stats = {
    languages: false,
    collections: {
      created: 0,
      updated: 0,
    },
    fields: {
      created: 0,
      updated: 0,
    },
    relations: {
      created: 0,
      updated: 0,
    },
  };

  const order = [];
  let collections = sourceCollections.slice(0);
  console.log("Select migration order:");

  while (collections.length) {
    const { name } = await nextCollection(collections);
    const index = collections.findIndex((c) => c.collection === name);
    order.push(collections.splice(index, 1)[0]);
  }

  console.log("");

  const addedCollections = order.filter(
    (a) => !targetCollections.find((b) => a.collection === b.collection)
  );
  const updatedCollections = order.filter((a) => {
    const b = targetCollections.find((c) => a.collection === c.collection);
    return b && !equal(a.meta, b.meta);
  });

  bar.start(
    sourceCollections.length +
      addedCollections.length +
      updatedCollections.length +
      1 +
      (languages === null ? 1 : 0),
    0,
    {
      message:
        languages === null
          ? "adding languages collection"
          : "adding collections",
    }
  );

  if (languages === null) {
    await addLanguages(target);
    stats.languages = true;
    bar.increment({ message: "adding collections" });
  }

  for (const collection of addedCollections) {
    if (!config.dry) {
      // Grab the primary key field
      const fields = await source.getFields(collection.collection, true);
      await target.createCollection({
        ...collection,
        fields,
      });
    }
    stats.collections.created += 1;
    bar.increment({ message: "updating collections" });
  }

  for (const collection of updatedCollections) {
    if (!config.dry) {
      await target.updateCollection(collection);
    }
    stats.collections.updated += 1;
    bar.increment({ message: "updating fields" });
  }

  for (const collection of order) {
    bar.increment({ message: `migrating ${collection.collection}` });
    const sourceFields = await source.getFields(collection.collection);
    const targetFields = await target.getFields(collection.collection);

    const addedFields = sourceFields.filter(
      (a) => !targetFields.find((b) => a.field === b.field)
    );
    const updatedFields = sourceFields.filter((a) => {
      const b = targetFields.find((c) => a.field === c.field);
      return b && !equal(a.meta, b.meta);
    });

    for (const field of addedFields) {
      if (!config.dry) {
        await target.createField(collection.collection, field);
      }
      stats.fields.created += 1;
    }

    for (const field of updatedFields) {
      if (!config.dry) {
        await target.updateField(collection.collection, field);
      }
      stats.fields.updated += 1;
    }

    const sourceRelations = await source.getRelations(collection.collection);
    const targetRelations = await target.getRelations(collection.collection);

    const addedRelations = sourceRelations.filter(
      (a) => !targetRelations.find((b) => a.field === b.field)
    );

    const updatedRelations = sourceRelations.filter((a) => {
      const b = targetRelations.find((c) => a.field === c.field);
      return b && !equal(a.meta, b.meta);
    });

    for (const relation of addedRelations) {
      if (!config.dry) {
        await target.createRelation(collection.collection, relation);
      }
      stats.relations.created += 1;
    }

    for (const relation of updatedRelations) {
      if (!config.dry) {
        await target.updateRelation(collection.collection, relation);
      }
      stats.relations.updated += 1;
    }
  }

  bar.increment();
  bar.stop();

  if (config.dry) {
    console.log("💾 Dry run complete.");
  } else {
    console.log("🥕 Migration complete.");
  }

  console.log("");

  if (stats.languages) {
    console.log("Created languages collection.");
  }

  logStat("Created", "collections", stats.collections.created);
  logStat("Updated", "collections", stats.collections.updated);
  logStat("Created", "fields", stats.fields.created);
  logStat("Updated", "fields", stats.fields.updated);
  logStat("Created", "relations", stats.relations.created);
  logStat("Updated", "relations", stats.relations.updated);
}

main(process.argv).catch((err) => {
  console.log(err);
  process.exit(1);
});
