import * as Joi from 'joi';
import { FormResponse } from '../models';
import { telemetryHelper } from '../telemetryHelper';
import * as _ from 'lodash';

export class RequestValidator {

  public validateCreateAPI(req, res, next) {
    const schema = Joi.object().keys({
      request: Joi.object().keys({
        type: Joi.string().required(),
        subType: Joi.string().required(),
        action: Joi.string().required(),
        component: Joi.string(), // optional
        rootOrgId: Joi.string(), // optional
        framework: Joi.string(), // optional
        data: Joi.object().required()
      }).required()
    });
    const body = {request: _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component'])};
    const { error, value } = Joi.validate(body, schema, {abortEarly: false});
    if (error) {
      res.status(400)
      .send(new FormResponse({
        id: "api.form.create",
        err: "ERR_CREATE_FORM_DATA",
        errmsg: error.details.map(d => d.message),
        responseCode: "CLIENT_ERROR"
      }));
      telemetryHelper.error(req, res, error);
    } else if(!req.body.request.framework && !req.body.request.rootOrgId) {
      // when "framework" & "rootOrgId" is not defined it should create default data
      next()
    } else if(req.body.request.framework && !req.body.request.rootOrgId) {
      // "framework" cannot exist without a "rootOrgId"
      res.status(400)
      .send(new FormResponse({
        id: "api.form.create",
        err: "ERR_CREATE_FORM_DATA",
        errmsg: `specifiy "rootOrgId" along with "framework"`,
        responseCode: "CLIENT_ERROR"
      }));
      telemetryHelper.error(req, res, error);
    } else {
      next()
    }
  }

  public validateUpdateAPI(req, res, next) {
    const schema = Joi.object().keys({
      request: Joi.object().keys({
        type: Joi.string().required(),
        subType: Joi.string().required(),
        action: Joi.string().required(),
        component: Joi.string(), // optional
        rootOrgId: Joi.string(), //optional
        framework: Joi.string(), // optional
        data: Joi.object().required()
      }).required()
    });
    const body = {request: _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component'])};
    const { error, value } = Joi.validate(body, schema, {abortEarly: false});
    if (error) {
      res.status(400)
      .send(new FormResponse({
        id: "api.form.update",
        err: "ERR_UPDATE_FORM_DATA",
        errmsg: error.details.map(d => d.message),
        responseCode: "CLIENT_ERROR"
      }));
      telemetryHelper.error(req, res, error);
    } else if(!req.body.request.framework && !req.body.request.rootOrgId) {
      // when "framework" & "rootOrgId" is not defined it should update default data
      next()
    } else if(req.body.request.framework && !req.body.request.rootOrgId) {
      // "framework" cannot exist without a "rootOrgId"
      res.status(400)
      .send(new FormResponse({
        id: "api.form.update",
        err: "ERR_UPDATE_FORM_DATA",
        errmsg: `specifiy "rootOrgId" along with "framework"`,
        responseCode: "CLIENT_ERROR"
      }));
      telemetryHelper.error(req, res, error);
    } else {
      next()
    }
  }

  public validateReadAPI(req, res, next) {
    const schema = Joi.object().keys({
      request: Joi.object().keys({
        type: Joi.string().required(),
        subType: Joi.string().required(),
        action: Joi.string().required(),
        component: Joi.string(), // optional
        rootOrgId: Joi.string(), // optional
        framework: Joi.string() // optional
      }).required()
    });
    const body = {request: _.pick(req.body.request, ['type', 'subType', 'action', 'rootOrgId', 'framework', 'data', 'component'])};
    const { error, value } = Joi.validate(body, schema, {abortEarly: false});
    if (error) {
      res.status(400)
      .send(new FormResponse({
        id: "api.form.read",
        err: "ERR_READ_FORM_DATA",
        errmsg: error.details.map(d => d.message),
        responseCode: "CLIENT_ERROR"
      }));
      telemetryHelper.error(req, res, error);
    } else if(!req.body.request.framework && !req.body.request.rootOrgId) {
      // when "framework" & "rootOrgId" is not defined it should send default data
      next()
    } else if(req.body.request.framework && !req.body.request.rootOrgId) {
      // "framework" cannot exist without a "rootOrgId"
      res.status(400)
      .send(new FormResponse({
        id: "api.form.read",
        err: "ERR_READ_FORM_DATA",
        errmsg: `specifiy "rootOrgId" along with "framework"`,
        responseCode: "CLIENT_ERROR"
      }));
      telemetryHelper.error(req, res, error);
    } else {
      next()
    }
  }
}