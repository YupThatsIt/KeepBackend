const validateEmail = (email) => {
    return String(email).toLowerCase().match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const validateTaxID = (name) => {
  return String(name).match(/^\d{13}$/);
};

const validateNameEN = (name) => {
  return String(name).toLowerCase().match(/^[a-zA-Z]+$/);
};

const validateName = (name) => {
  return String(name).toLowerCase().match(/^[a-zA-Z\u0E00-\u0E7F]+$/);
};

const validatePhone = (phone) => {
  return String(phone).match(/^\d{10}$/);
};

module.exports = { validateEmail, validatePhone, validateName, validateNameEN, validateTaxID } ;