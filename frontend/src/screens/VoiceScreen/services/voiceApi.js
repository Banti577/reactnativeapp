import axios from 'axios';

export const API_URL = 'http://10.49.211.1:3000';

export const fetchTwilioToken = async (identity) => {
  const response = await axios.get(
    `${API_URL}/voice/token?identity=${encodeURIComponent(identity)}`,
  );

  return response.data.token;
};
