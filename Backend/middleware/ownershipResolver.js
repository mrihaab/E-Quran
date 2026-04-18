function resolveOwnershipId(req) {
  const params = req && req.params ? req.params : {};

  return params.userId
    ?? params.id
    ?? params.studentId
    ?? params.teacherId
    ?? params.partnerId
    ?? null;
}

module.exports = {
  resolveOwnershipId
};
