const aws = require('aws-sdk')
const { parse } = require('querystring');
const url = require('url');
const ses = new aws.SES()
const getParamsFromUrl = require('./getParamsFromUrl')

module.exports = (options) => {
  const { myEmail, myDomains } = options;
  let origin = null;

  function generateResponse(code, payload) {
    return {
      statusCode: code,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'x-requested-with',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(payload)
    }
  }
  function generateError(code, err) {
    console.log(err)
    return {
      statusCode: code,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'x-requested-with',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(err.message)
    }
  }
  function generateRedirect(code, event) {
    
    return {
      statusCode: code,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'x-requested-with',
        'Access-Control-Allow-Credentials': true,
        'Location': url.parse(event.headers.origin).href + parse(event.body).redirectPage      }
    }
  }
  function generateEmailParamsFromJSON(body) {
    const params = JSON.parse(body)
    if (!(email && name && content)) {
      throw new Error('Missing parameters! Make sure to add parameters \'email\', \'name\', \'content\'.')
    }

    return {
      Source: myEmail,
      Destination: { ToAddresses: [myEmail] },
      ReplyToAddresses: [email],
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: `Message sent from email ${email} by ${name} \nContent: ${content}`
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `You received a message from ${origin}!`
        }
      }
    }
  }
  function generateEmailParamsFromUriEncoded(body) {
    const params = getParamsFromUrl(body);
    if (!(params['email'] && params['name'] && params['content'])) {
      throw new Error('Missing parameters! Make sure to add parameters \'email\', \'name\', \'content\'.')
    }

    if (params['_honeypot'] != '') {
      throw new Error('Possible spam');
    }

    const replacedName = params['name'].replace(/\+/g, ' ');
    var arr = [];
    for (var key in params) {
      arr.push(key + '=' + params[key]);
    }
    const content = arr.join('\n').replace(/\+/g, ' ');
    const email = params['email'];
    return {
      Source: myEmail,
      Destination: { ToAddresses: [myEmail] },
      ReplyToAddresses: [email],
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: `Message sent from email ${email} by ${replacedName} \n
            Content: ${content}`
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `You received a message from ${origin}`
        }
      }
    }
  }

  function  checkOriginAllowed(event) {
    if (myDomains.includes(url.parse(event.headers.origin).hostname)) {
      origin = event.headers.origin;
    } else {
      throw new Error('Invalid params');
    }
  }

  async function sendJSON(event) {
    try {
      checkOriginAllowed(event);
      const emailParams = generateEmailParamsFromJSON(event.body)
      const data = await ses.sendEmail(emailParams).promise()
      return generateResponse(200, data)
    } catch (err) {
      return generateError(500, err)
    }
  }
  async function sendFormEncoded(event) {
    try {
      checkOriginAllowed(event);
      const emailParams = generateEmailParamsFromUriEncoded(event.body)
      await ses.sendEmail(emailParams).promise()
      return generateRedirect(302, event)
    } catch (err) {
      return generateError(500, err)
    }
  }

  return {
    sendJSON,
    sendFormEncoded
  }
}
