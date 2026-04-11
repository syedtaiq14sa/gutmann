const getSingleRow = (result) => (Array.isArray(result) ? result[0] : result || null);

module.exports = { getSingleRow };
