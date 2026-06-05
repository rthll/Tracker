import {
  completeSignup,
  requestSignupCode
} from "../services/signup-code.service.js";

export async function postSignupCode(request, response, next) {
  try {
    const result = await requestSignupCode(request.body && request.body.email);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function postCompleteSignup(request, response, next) {
  try {
    const result = await completeSignup(request.body || {});
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
