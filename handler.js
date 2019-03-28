const options = {
  myEmails: process.env.EMAILS,
  myDomains: process.env.DOMAINS
}
const { sendJSON, sendFormEncoded } = require('./lambdaMailer')(options)
module.exports.sendJSON = sendJSON
module.exports.sendFormEncoded = sendFormEncoded
