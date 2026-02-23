import { apiPost, apiGet } from './client';
import type { LoginResponse } from '@milionerzy/shared';
import { firebaseAuth } from '../firebase';

export async function loginWithToken(idToken: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { idToken });
}

export async function login(): Promise<LoginResponse> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Not logged in');
  const idToken = await user.getIdToken();
  return loginWithToken(idToken);
}

export async function getMe(): Promise<any> {
  return apiGet<any>('/auth/me');
}
