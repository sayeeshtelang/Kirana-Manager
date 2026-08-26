const { validationResult } = require('express-validator');

// Run after an express-validator chain; returns a 400 with all field errors
// in a shape the frontend (React Hook Form) can map back onto fields.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
