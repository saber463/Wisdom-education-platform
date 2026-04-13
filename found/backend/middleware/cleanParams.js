const cleanParams = (req, res, next) => {
  if (req.query) {
    for (const key in req.query) {
      if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        if (req.query[key] === '' || req.query[key] === null || req.query[key] === undefined) {
          delete req.query[key];
        } else if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].trim();
          req.query[key] = req.query[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
          req.query[key] = req.query[key].replace(/'|"|;|--|\/\*/g, '');
        }
      }
    }
  }

  if (req.params) {
    for (const key in req.params) {
      if (Object.prototype.hasOwnProperty.call(req.params, key)) {
        if (typeof req.params[key] === 'string') {
          req.params[key] = req.params[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
          req.params[key] = req.params[key].replace(/'|"|;|--|\/\*/g, '');
        }
      }
    }
  }

  if (req.body) {
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        if (req.body[key] === '' || req.body[key] === null || req.body[key] === undefined) {
          delete req.body[key];
        } else if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      }
    }
  }

  next();
};

export default cleanParams;
