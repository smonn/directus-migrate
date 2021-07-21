import got, { Got } from "got/dist/source";
import {
  DirectusResponse,
  DirectusCollection,
  DirectusField,
  DirectusRelation,
} from "./types";

export interface DirectusClientOptions {
  url: string;
  token: string;
}

export class DirectusClient {
  http: Got;

  constructor(private readonly options: DirectusClientOptions) {
    this.http = got.extend({
      prefixUrl: this.options.url,
      headers: {
        Authorization: `Bearer ${this.options.token}`,
      },
    });
  }

  async getCollections() {
    return await this.http
      .get("collections")
      .json<DirectusResponse<DirectusCollection[]>>()
      .then(({ data }) =>
        data.filter(
          (c) =>
            !c.collection.startsWith("directus_") &&
            c.collection !== "languages"
        )
      )
      .catch((err) => {
        console.error("[ERROR]", "GET /collections");
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        return [];
      });
  }

  async getCollection(collection: string) {
    return await this.http
      .get(`collections/${collection}`)
      .json<DirectusResponse<DirectusCollection>>()
      .then(({ data }) => data)
      .catch((err) => {
        console.error("[ERROR]", `GET /collections/${collection}`);
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        process.exit(1);
      });
  }

  async createCollection(collection: DirectusCollection) {
    return await this.http
      .post("collections", {
        json: collection,
      })
      .json()
      .catch((err) => {
        console.error("[ERROR]", "POST /collections", collection);
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        process.exit(1);
      });
  }

  async updateCollection(collection: DirectusCollection) {
    return await this.http
      .patch(`collections/${collection.collection}`, {
        json: {
          meta: collection.meta,
        },
      })
      .json()
      .catch((err) => {
        console.error(
          "[ERROR]",
          `PATCH /collections/${collection.collection}`,
          { meta: collection.meta }
        );
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        process.exit(1);
      });
  }

  async deleteCollection(collection: string) {
    return await this.http
      .delete(`collections/${collection}`)
      .json()
      .catch((err) => {
        console.error("[ERROR]", `DELETE /collections/${collection}`);
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        process.exit(1);
      });
  }

  async getFields(collection: string, isPrimaryKey = false) {
    return await this.http
      .get(`fields/${collection}`)
      .json<DirectusResponse<DirectusField[]>>()
      .then((res) =>
        res.data
          .filter((f) => !!f.schema?.is_primary_key === isPrimaryKey)
          .map((f) => {
            delete f.meta?.id;
            return f;
          })
      )
      .catch((err) => {
        console.error("[ERROR]", `GET /fields/${collection}`);
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        return [];
      });
  }

  async createField(collection: string, field: DirectusField) {
    delete field.meta?.id;
    return await this.http
      .post(`fields/${collection}`, {
        json: field,
      })
      .json()
      .catch((err) => {
        console.error("[ERROR]", `POST /fields/${collection}`, field);
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        process.exit(1);
      });
  }

  async updateField(collection: string, field: DirectusField) {
    delete field.meta?.id;
    return await this.http
      .patch(`fields/${collection}/${field.field}`, {
        json: {
          collection: field.collection,
          field: field.field,
          type: field.type,
          meta: field.meta,
        },
      })
      .json()
      .catch((err) => {
        console.error("[ERROR]", `POST /fields/${collection}/${field.field}`, {
          meta: field.meta,
        });
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        process.exit(1);
      });
  }

  async deleteField(collection: string, field: string) {
    return await this.http
      .delete(`fields/${collection}/${field}`)
      .json()
      .catch((err) => {
        console.error("[ERROR]", `DELETE /fields/${collection}/${field}`);
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        process.exit(1);
      });
  }

  async getRelations(collection: string) {
    return await this.http
      .get(`relations/${collection}`)
      .json<DirectusResponse<DirectusRelation[]>>()
      .then(({ data }) =>
        data.map((r) => {
          delete r.meta?.id;
          return r;
        })
      )
      .catch((err) => {
        console.error("[ERROR]", `GET /relations/${collection}`);
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        return [];
      });
  }

  async createRelation(collection: string, relation: DirectusRelation) {
    delete relation.meta?.id;
    return await this.http
      .post(`relations`, {
        json: relation,
      })
      .json()
      .catch((err) => {
        console.error("[ERROR]", "POST /relations", relation);
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        process.exit(1);
      });
  }

  async updateRelation(collection: string, relation: DirectusRelation) {
    delete relation.meta?.id;
    return await this.http
      .patch(`relations/${collection}/${relation.field}`, {
        json: {
          collection: relation.collection,
          field: relation.field,
          related_collection: relation.related_collection,
          meta: relation.meta,
        },
      })
      .json()
      .catch((err) => {
        console.error(
          "[ERROR]",
          `PATCH /relations/${collection}/${relation.field}`,
          { meta: relation.meta }
        );
        console.error("[ERROR]", err.message);
        console.error(
          "[ERROR] response:",
          JSON.stringify(JSON.parse(err.response.body), null, 2)
        );
        process.exit(1);
      });
  }
}
