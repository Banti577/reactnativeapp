export const normalizePhoneNumber = (value?: string | null) => value?.trim() ?? '';

export const isE164PhoneNumber = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);
