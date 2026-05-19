import axios from 'axios';

import { ENV } from '../../config';

export const httpClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
});

