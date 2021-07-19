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
    return await this.http("collections")
      .json<DirectusResponse<DirectusCollection[]>>()
      .then(({ data }) =>
        data.filter(
          (c) =>
            !c.collection.startsWith("directus_") &&
            c.collection !== "languages"
        )
      )
      .catch(() => []);
  }

  async getCollection(collection: string) {
    return await this.http(`collections/${collection}`)
      .json<DirectusResponse<DirectusCollection>>()
      .then(({ data }) => data)
      .catch(() => null);
  }

  async createCollection(collection: DirectusCollection) {
    return await this.http.post("collections", {
      json: collection,
    });
  }

  async updateCollection(collection: DirectusCollection) {
    return await this.http
      .patch(`collections/${collection.collection}`, {
        json: {
          meta: collection.meta,
        },
      })
      .json();
  }

  async deleteCollection(collection: string) {
    return await this.http.delete(`collections/${collection}`);
  }

  async getFields(collection: string, isPrimaryKey = false) {
    return await this.http
      .get(`fields/${collection}`)
      .json<DirectusResponse<DirectusField[]>>()
      .then((res) =>
        res.data.filter((f) => !!f.schema?.is_primary_key === isPrimaryKey)
      )
      .catch(() => []);
  }

  async createField(collection: string, field: DirectusField) {
    return await this.http
      .post(`fields/${collection}`, {
        json: field,
      })
      .json();
  }

  async updateField(collection: string, field: DirectusField) {
    return await this.http
      .patch(`fields/${collection}/${field}`, {
        json: {
          meta: field.meta,
        },
      })
      .json();
  }

  async deleteField(collection: string, field: string) {
    return await this.http.delete(`fields/${collection}/${field}`).json();
  }

  async getRelations(collection: string) {
    return await this.http
      .get(`relations/${collection}`)
      .json<DirectusResponse<DirectusRelation[]>>()
      .then(({ data }) => data)
      .catch(() => []);
  }

  async createRelation(collection: string, relation: DirectusRelation) {
    return await this.http
      .post(`relations`, {
        json: relation,
      })
      .json();
  }

  async updateRelation(collection: string, relation: DirectusRelation) {
    return await this.http
      .patch(`relations/${collection}/${relation.field}`, {
        json: {
          meta: relation.meta,
        },
      })
      .json();
  }
}
