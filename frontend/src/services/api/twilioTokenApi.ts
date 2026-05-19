import { httpClient } from './httpClient';

type TwilioTokenResponse = {
  token: string;
};

export const fetchTwilioToken = async (identity: string): Promise<string> => {
  const response = await httpClient.get<TwilioTokenResponse>('/voice/token', {
    params: { identity },
  });

  return response.data.token;
};
