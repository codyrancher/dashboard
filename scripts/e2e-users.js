/* eslint-disable no-console */
/**
 * Gives a Cypress process a Rancher user of its own, so that processes running side by side
 * (see `scripts/e2e-parallel`) do not share per-user state such as preferences.
 */

const https = require('https');

const SCHEMA_WAIT_MS = 90000;

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
    const legacy = await expectStatus(request(api, 'POST', '/v3-public/localProviders/local?action=login', {
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

async function schemaIds(api, token) {
  const res = await expectStatus(request(api, 'GET', '/v1/schemas', { token }), 200, 'Listing schemas');

  return new Set(res.body.data.map((schema) => schema.id));
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
    await expectStatus(request(api, 'POST', '/v1/secrets', {
      token: adminToken,
      body:  {
        type:     'secret',
        metadata: { namespace: 'cattle-local-user-passwords', name: id },
        data:     { password: Buffer.from(password).toString('base64') }
      }
    }), 201, `Setting the password of ${ username }`);
  } else {
    // Rancher before v2.13 creates users, with their password, through the v3 API
    created = await expectStatus(request(api, 'POST', '/v3/users', {
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

/**
 * Creates a user with the same global, cluster and project roles and the same preferences as
 * an existing user, and waits until it can see everything that user can
 *
 * @param {string} api Rancher URL
 * @param {string} adminToken session token of a user that can manage users
 * @param {string} username the user to copy
 * @param {string} password password of the user to copy, also given to the new user
 * @param {string} newUsername
 * @returns {Promise<string>} id of the new user
 */
async function cloneUser(api, adminToken, username, password, newUsername) {
  const users = await expectStatus(request(api, 'GET', '/v1/management.cattle.io.users', { token: adminToken }), 200, 'Listing users');
  const source = users.body.data.find((user) => user.username === username);

  if (!source) {
    throw new Error(`There is no user called ${ username }`);
  }

  for (const leftover of users.body.data.filter((user) => user.username === newUsername)) {
    await deleteUser(api, adminToken, leftover.id);
  }

  const { id, principalId } = await createUser(api, adminToken, newUsername, password);

  const sourcePrincipals = source.principalIds || [];
  const isSources = (binding) => binding.userId === source.id || sourcePrincipals.includes(binding.userPrincipalId);
  const copyBindings = async(type, toBody) => {
    const bindings = await expectStatus(request(api, 'GET', `/v3/${ type }s`, { token: adminToken }), 200, `Listing ${ type }s`);

    for (const binding of bindings.body.data.filter(isSources)) {
      await expectStatus(request(api, 'POST', `/v3/${ type }s`, { token: adminToken, body: { type, ...toBody(binding) } }), 201, `Copying a ${ type }`);
    }
  };

  await copyBindings('globalRoleBinding', (binding) => ({ globalRoleId: binding.globalRoleId, userId: id }));
  await copyBindings('clusterRoleTemplateBinding', (binding) => ({
    clusterId: binding.clusterId, roleTemplateId: binding.roleTemplateId, userPrincipalId: principalId
  }));
  await copyBindings('projectRoleTemplateBinding', (binding) => ({
    projectId: binding.projectId, roleTemplateId: binding.roleTemplateId, userPrincipalId: principalId
  }));

  const sourceToken = await login(api, username, password);
  const token = await login(api, newUsername, password);
  const wanted = await schemaIds(api, sourceToken);
  const deadline = Date.now() + SCHEMA_WAIT_MS;
  let missing = wanted.size;

  while (missing && Date.now() < deadline) {
    const got = await schemaIds(api, token);

    missing = [...wanted].filter((schema) => !got.has(schema)).length;

    if (missing) {
      await sleep(2000);
    }
  }

  if (missing) {
    throw new Error(`User ${ newUsername } still cannot see ${ missing } of the ${ wanted.size } resource types ${ username } can`);
  }

  const preferences = await request(api, 'GET', '/v1/userpreferences', { token: sourceToken });
  const data = preferences.body?.data?.[0]?.data;

  if (data && Object.keys(data).length) {
    await expectStatus(request(api, 'PUT', `/v1/userpreferences/${ id }`, {
      token,
      body: {
        id, type: 'userpreference', data
      }
    }), 200, `Copying preferences to ${ newUsername }`);
  }

  return id;
}

/**
 * Deletes a user created by cloneUser
 */
async function deleteUser(api, adminToken, id) {
  await request(api, 'DELETE', `/v3/users/${ id }`, { token: adminToken });
  await request(api, 'DELETE', `/v1/secrets/cattle-local-user-passwords/${ id }`, { token: adminToken });
}

module.exports = {
  request, expectStatus, sleep, login, createUser, cloneUser, deleteUser
};
