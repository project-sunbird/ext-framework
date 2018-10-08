import { Manifest, BaseServer } from '@project-sunbird/ext-framework-server/models';
import { Request, Response } from 'express';
import { FormResponse } from './models';
import * as _ from 'lodash';
import { telemetryHelper } from './telemetryHelper';
export class Server extends BaseServer {

  constructor(manifest: Manifest) {
    super(manifest);
  }

  public async create(req: Request, res: Response) {
    const data = _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']);
    const model = new this.cassandra.instance.form_data({
      root_org: data.rootOrgId,
      type: data.type,
      subtype: data.subType,
      action: data.action,
      component: data.component,
      framework: data.framework,
      data: JSON.stringify(data.data),
      created_on: new Date()
    })
    await model.saveAsync().then(data => {
      res.status(200)
        .send(new FormResponse(undefined, {
          id: 'api.form.create',
          data: {
            created: 'OK'
          }
        }))
        telemetryHelper.log(req);
    })
      .catch(error => {
        res.status(500)
          .send(new FormResponse({
            id: "api.form.create",
            err: "ERR_CREATE_FORM_DATA",
            errmsg: error
          }));
        telemetryHelper.error(req, res, error);
      })
  }

  public async update(req: Request, res: Response) {
    const data = _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']);
    let query = {
      root_org: data.rootOrgId || '*',
      framework: data.framework || '*',
      type: data.type,
      action: data.action,
      subtype: data.subType || '*',
      component: data.component || '*'
    };

    const updateValue = {
      data: JSON.stringify(data.data),
      last_modified_on: new Date()
    };
    
    await this.cassandra.instance.form_data.updateAsync(query, updateValue, { if_exists: true })
      .then(data => {
        if (!_.get(data, "rows[0].['[applied]']")) throw { msg: `invalid request, no records found for the match to update!`, client_error: true };
        res.status(200)
          .send(new FormResponse(undefined, {
            id: 'api.form.update',
            data: { "response": [{ "rootOrgId": query.root_org, "key": `${query.type}.${query.subtype}.${query.action}.${query.component}`, "status": "SUCCESS" }] }
          }))
        telemetryHelper.log(req);
      }).catch(error => {
        if (error.client_error) {
          res.status(400)
            .send(new FormResponse({
              id: "api.form.update",
              err: "ERR_UPDATE_FORM_DATA",
              responseCode: "CLIENT_ERROR",
              errmsg: error.msg
            }));
            telemetryHelper.error(req, res, error);
        } else {
          throw error;
        }
      })
      .catch(error => {
        res.status(500)
          .send(new FormResponse({
            id: "api.form.update",
            err: "ERR_UPDATE_FORM_DATA",
            errmsg: error
          }));
        telemetryHelper.error(req, res, error);
      })
  }

  public async read(req: Request, res: Response) {
    const data = _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component']);
    let onRecordFound: Promise<any>;
    const query = {
      root_org: data.rootOrgId,
      framework: data.framework,
      type: data.type,
      action: data.action,
      subtype: data.subType || '*',
      component: data.component || '*'
    }

    if (!query.root_org && !query.framework) {
      onRecordFound = this.cassandra.instance.form_data.findOneAsync(Object.assign({}, query, { root_org: "*", framework: "*" }));
    } else if (query.root_org && !query.framework) {
      onRecordFound = this.cassandra.instance.form_data.findOneAsync(Object.assign({}, query, { framework: "*" }));
    } else {
      onRecordFound = this.cassandra.instance.form_data.findOneAsync(query);
    }
    await onRecordFound.then(async data => {
      if (!data) {
        // find record by specified rootOrgId with framework = '*'
        await this.cassandra.instance.form_data.findOneAsync(Object.assign({}, query, { framework: "*" }))
      } else {
        return data;
      }
    })
      .then(async data => {
        if (!data) {
          // get the default data
          return await this.cassandra.instance.form_data.findOneAsync(Object.assign({}, query, { root_org: "*", framework: "*" }))
        } else {
          return data;
        }
      })
      .then(data => {
        if (!data) data = {}
        if (data && typeof data.data === "string") data.data = JSON.parse(data.data);

        data = data.toJSON(); // it removes all the schema validator of cassandra and gives plain object;
        if (_.get(data, 'root_org')) {
          data.rootOrgId = data.root_org;
          data = _.omit(data, ['root_org']);
        }
        res.status(200)
          .send(new FormResponse(undefined, {
            id: 'api.form.read',
            data: {
              form: data
            }
          }))
          telemetryHelper.log(req);
      })
      .catch(error => {
        res.status(500)
          .send(new FormResponse({
            id: "api.form.read",
            err: "ERR_READ_FORM_DATA",
            errmsg: error
          }));
        telemetryHelper.error(req, res, error);
      })
  }
}