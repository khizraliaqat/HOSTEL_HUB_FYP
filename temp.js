const bcrypt = require("bcrypt");

bcrypt.hash("admin123", 10).then(result => {
  console.log(result);
});
