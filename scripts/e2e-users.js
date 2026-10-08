/* eslint-disable no-console */
/**
 * Calls the Rancher API to log in and to create users, for the scripts that set up the e2e Rancher.
 */

const https = require('https');

/**
 * @returns {Promise<{ status: number, body: any, headers: object }>}
 */
function request(api, method, path, { token, body } = {}) {
  const payload = body ? JSON.stringify(body) : undefined;

  return new Promise((resolve, reject) => {
    const req = https.request(`${ api }${ path }`, {
      method,
      rejectUnauthorized: false,
      headers:            {
        Accept: 'application/json',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${ token }` } : {}),
      },
    }, (res) => {
      let text = '';

      res.on('data', (chunk) => (text += chunk));
      res.on('end', () => {
        let parsed = text;

        try {
          parsed = JSON.parse(text);
        } catch (e) {}

        resolve({
          status: res.statusCode, body: parsed, headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.end(payload);
  });
}

/**
 * Sends a request, again every 2 seconds for up to a minute while Rancher answers with a server
 * error. Its webhook and aggregated API are briefly unavailable at times soon after it starts.
 */
async function send(api, method, path, options) {
  let res;

  for (let i = 0; i < 30; i++) {
    res = await request(api, method, path, options);

    if (res.status < 500) {
      break;
    }

    await sleep(2000);
  }

  return res;
}

async function expectStatus(promise, expected, what) {
  const res = await promise;

  if (![].concat(expected).includes(res.status)) {
    throw new Error(`${ what } failed with ${ res.status }: ${ JSON.stringify(res.body).slice(0, 300) }`);
  }

  return res;
}

/**
 * @returns {Promise<string>} a session token for the user
 */
async function login(api, username, password) {
  let res;

  for (let i = 0; i < 30; i++) {
    res = await request(api, 'POST', '/v1-public/login', {
      body: {
        username, password, type: 'localProvider', responseType: 'cookie', description: 'e2e'
      }
    });

    if (res.status !== 503) {
      break;
    }

    await sleep(2000);
  }

  if (res.status === 404) {
    // Rancher before v2.13 only has the v3 login
    const legacy = await expectStatus(send(api, 'POST', '/v3-public/localProviders/local?action=login', {
      body: {
        username, password, responseType: 'json', description: 'e2e'
      }
    }), [200, 201], `Logging in as ${ username }`);

    return legacy.body.token;
  }

  await expectStatus(Promise.resolve(res), [200, 201], `Logging in as ${ username }`);

  const cookie = (res.headers['set-cookie'] || []).map((c) => c.match(/^R_SESS=([^;]+)/)).find(Boolean);

  if (!cookie) {
    throw new Error(`Logging in as ${ username } returned no session`);
  }

  return cookie[1];
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a local user that can log in with the given password
 *
 * @returns {Promise<{ id: string, principalId: string }>}
 */
async function createUser(api, adminToken, username, password) {
  let created = await request(api, 'POST', '/v1/management.cattle.io.users', {
    token: adminToken,
    body:  {
      type: 'user', enabled: true, mustChangePassword: false, username
    }
  });
  let id = created.body?.id;

  if (created.status === 201) {
    const setPassword = () => send(api, 'POST', '/v1/secrets', {
      token: adminToken,
      body:  {
        type:     'secret',
        metadata: { namespace: 'cattle-local-user-passwords', name: id },
        data:     { password: Buffer.from(password).toString('base64') }
      }
    });
    let secret = await setPassword();

    // Rancher's webhook rejects the secret until it has seen the new user
    for (let i = 0; i < 20 && secret.status === 400; i++) {
      await sleep(500);
      secret = await setPassword();
    }

    await expectStatus(Promise.resolve(secret), 201, `Setting the password of ${ username }`);
  } else {
    // Rancher before v2.13 creates users, with their password, through the v3 API
    created = await expectStatus(send(api, 'POST', '/v3/users', {
      token: adminToken,
      body:  {
        type: 'user', enabled: true, mustChangePassword: false, username, password
      }
    }), 201, `Creating user ${ username }`);
    id = created.body.id;
  }

  let principalId;

  for (let i = 0; i < 20 && !principalId; i++) {
    const user = await request(api, 'GET', `/v1/management.cattle.io.users/${ id }`, { token: adminToken });

    principalId = user.body?.principalIds?.[0];

    if (!principalId) {
      await sleep(500);
    }
  }

  if (!principalId) {
    throw new Error(`User ${ username } was never given a principal`);
  }

  return { id, principalId };
}

module.exports = {
  request, send, expectStatus, sleep, login, createUser
};
