import { apiPost } from './client';

export async function deleteClassOnServer(classId: string): Promise<void> {
  await apiPost(`/user/classes/${classId}/delete`, {});
}
