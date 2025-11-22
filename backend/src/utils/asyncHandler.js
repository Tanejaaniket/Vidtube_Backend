//** THIS IS ONLY USEABLE IN EXPRESS ROUTERS NOT FOR ANYTHING ELSE

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

export { asyncHandler };
