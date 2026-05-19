import { httpClient } from './httpClient';

export const fetchTwilioToken = async identity => {
  const response = await httpClient.get('/voice/token', {
    params: { identity },
  });

  return response.data.token;
};

