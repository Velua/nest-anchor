import { APIProvider } from "@greymass/eosio";
import axios from "axios";

export class AxiosAPIProvider implements APIProvider {
  readonly url: string;

  constructor(url: string) {
    this.url = url.endsWith("/") ? url.slice(-1) : url;
  }

  async call(path: string, params: any) {
    try {
      const response = await axios.post(this.url + path, params);

      const headers = response.headers;
      const status = response.status;
      const json = response.data;
      const text = JSON.stringify(response.data);

      return { headers, status, json, text };
    } catch (error) {
      if (error.response && error.response.data) {
        return error.response.data;
      } else {
        throw error;
      }
    }
  }
}
