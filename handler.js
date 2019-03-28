const options = {
  myEmail: process.env.EMAIL,
  myDomains: process.env.DOMAINS
}
const { sendJSON, sendFormEncoded } = require('./lambdaMailer')(options)
module.exports.sendJSON = sendJSON
module.exports.sendFormEncoded = sendFormEncoded
