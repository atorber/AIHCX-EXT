import { callBecOpenApi } from '../src/utils/aihcOpenApi';

const ak = '1234567890';
const sk = '1234567890';
const host = 'https://console.bce.baidu.com';
const path = '/api/v1/resourcepools';
const method = 'GET';
const query = {};
const body = {};

callBecOpenApi(ak, sk, host, path, method, query, body);