const parseErrors = errors => {
  const result = {};
  Object.entries(errors).forEach(entry => {
    const [key, value] = entry;
    result[key] = value.message;
  });
  return result;
};

export default parseErrors;
