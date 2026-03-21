import axios from "axios";
import { ENDPOINTS } from "../endpoints/API_ENDPOINTS";
import Cookies from "js-cookie";

const baseURL = import.meta.env.VITE_SOCKET_SERVER_URL;
const token = Cookies.get("accessToken");

export const socketClient = axios.create({
  baseURL,
  headers: {
    Authorization: token ? `Bearer ${token}` : undefined,
  },
});

class SocketServer {
  createRoom = async (data) => {
    try {
      const response = await socketClient.post(ENDPOINTS.createRoom, data);
      return response.data;
    } catch (err) {
      return err;
    }
  };
}

const socketServerInstance = new SocketServer();

export default socketServerInstance;
