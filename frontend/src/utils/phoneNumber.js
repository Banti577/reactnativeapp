export const normalizePhoneNumber = value => value?.trim() ?? '';

export const isE164PhoneNumber = value => /^\+[1-9]\d{7,14}$/.test(value);

