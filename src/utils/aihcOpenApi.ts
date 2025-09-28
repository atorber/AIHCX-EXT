import { Auth } from "@baiducloud/sdk";
import rp from "request-promise";

const getSignature = (ak: string, sk: string, method: string, path: string, query: Record<string, any>, headers: Record<string, any>) => {
  const auth = new Auth(ak, sk);
  // 设置有效时间
  let timestamp = Math.floor(new Date().getTime() / 1000);
  let expirationPeriondInSeconds = 1800;
  let signature = auth.generateAuthorization(
    method,
    path,
    query,
    headers,
    timestamp,
    expirationPeriondInSeconds
  );
  return signature;
};

const callBecOpenApi = async (ak: string, sk: string, host: string, path: string, method: string, query: any = {}, body: any = {}) => {

  const uri = `https://${host}${path}`;
  let headers: Record<string, any> = {
    Host: host,
  };

  const signature = getSignature(ak, sk, method, path, query, headers);
  
  headers.Authorization = signature;

  try{
    const opt = {
      method,
      uri,
      qs: query,
      body,
      headers,
      json: true,
    };
    console.debug("请求参数：", opt);
    const res = await rp(opt);
    console.debug("返回的结果：", res);
    return res;
  } catch (err: any) {
    console.error("报错信息：", err);
    return err;
  }
};

export { callBecOpenApi };
